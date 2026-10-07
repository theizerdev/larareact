<?php

namespace App\Services\Validaciones;

use App\Models\KycValidacion;
use App\Notifications\KycValidacionCompletadaNotification;
use App\Services\NotificationDispatcher;
use App\Services\TruoraService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Verificación de antecedentes (background check) con TRUORA: abre el check con
 * la CURP de la persona y lleva su resultado a la fila kyc_validaciones, a la
 * persona y al folio. El check tarda unos minutos; el resultado siempre se
 * vuelve a pedir a la API (el webhook sólo avisa, nunca se confía en su contenido).
 *
 * El score va de 0 a 1 (1 = máxima confianza). Por debajo del mínimo de la
 * empresa queda "en revisión" para decisión humana: nunca se rechaza solo.
 */
class TruoraSincronizador
{
    /** Estados de Truora en los que el check sigue en curso. */
    private const EN_CURSO = ['not_started', 'enqueued', 'queued', 'in_progress', 'processing', 'delayed', 'started', 'created', 'pending'];

    /** Abre el check en Truora. Si falla, la validación queda en 'error' con el detalle; nunca lanza. */
    public static function iniciar(KycValidacion $val): bool
    {
        $empresa = $val->empresa()->withoutGlobalScopes()->first();

        if (! $empresa) {
            return false;
        }

        $curp = strtoupper(trim((string) $val->curp_capturada));

        if ($curp === '') {
            return self::fallar($val, 'Falta la CURP de la persona para consultar antecedentes.');
        }

        $res = (new TruoraService($empresa))->crearCheck(
            $curp,
            $val->pais_documento,
            'hosho:kyc:'.$val->id,
        );

        $checkId = $res['data']['check']['check_id'] ?? $res['data']['check_id'] ?? null;

        if (! $res['ok'] || ! $checkId) {
            return self::fallar($val, 'No se pudo crear la consulta en TRUORA: '.($res['error'] ?? 'respuesta incompleta'));
        }

        $val->forceFill(['truora_check_id' => $checkId, 'estatus' => KycValidacion::ESTATUS_PENDIENTE])->save();

        return true;
    }

    /**
     * Consulta el check y consolida el resultado. Devuelve true si cambió algo.
     */
    public static function sincronizar(KycValidacion $val): bool
    {
        if (! $val->esTruora() || empty($val->truora_check_id) || $val->estaFinalizada()) {
            return false;
        }

        $empresa = $val->empresa()->withoutGlobalScopes()->first();

        if (! $empresa) {
            return false;
        }

        $servicio = new TruoraService($empresa);
        $res = $servicio->getCheck($val->truora_check_id);

        if (! $res['ok']) {
            Log::warning('TRUORA: no se pudo leer el check', ['kyc_validacion_id' => $val->id, 'status' => $res['status']]);

            return false;
        }

        $check = $res['data']['check'] ?? $res['data'];
        $estado = strtolower((string) ($check['status'] ?? ''));

        if ($estado === '' || in_array($estado, self::EN_CURSO, true)) {
            return false; // sigue en curso
        }

        if ($estado !== 'completed') {
            return self::fallar($val, 'La consulta de TRUORA terminó con estado "'.$estado.'".');
        }

        $detalle = $servicio->getDetalle($val->truora_check_id);

        return self::aplicar($val, $check, $detalle['ok'] ? $detalle['data'] : [], TruoraService::scoreMinimoDe($empresa));
    }

    public static function aplicar(KycValidacion $val, array $check, array $detalle, float $minimo): bool
    {
        $score = isset($check['score']) && is_numeric($check['score']) ? (float) $check['score'] : null;
        $estatusAnterior = $val->estatus;
        $observaciones = [];

        if ($score === null || $score < 0) {
            $nuevo = KycValidacion::ESTATUS_REVISION;
            $observaciones[] = 'TRUORA terminó la consulta sin calcular un score; revisa el detalle.';
        } elseif ($score >= $minimo) {
            $nuevo = KycValidacion::ESTATUS_APROBADO;
            $observaciones[] = sprintf('Antecedentes: score %.2f (mínimo %.2f). Sin hallazgos relevantes.', $score, $minimo);
        } else {
            $nuevo = KycValidacion::ESTATUS_REVISION;
            $observaciones[] = sprintf('Antecedentes: score %.2f por debajo del mínimo %.2f. Revisa los hallazgos en TRUORA.', $score, $minimo);
        }

        $val->forceFill([
            'estatus' => $nuevo,
            'score_global' => $score !== null && $score >= 0 ? round($score, 2) : null,
            'en_listas' => $score !== null && $score >= 0 ? $score < $minimo : null,
            'resultado_listas' => self::depurar(['check' => $check, 'details' => $detalle]),
            'observaciones' => implode("\n", $observaciones),
            'error_detalle' => null,
            'procesado_en' => now(),
        ])->save();

        self::propagar($val);

        if ($estatusAnterior !== $val->estatus) {
            self::notificar($val);
        }

        return true;
    }

    /**
     * Revisa las verificaciones de antecedentes aún abiertas (a lo más una
     * consulta por check cada 30 s). Se llama al abrir las pantallas de
     * resultados: la instalación no tiene scheduler ni worker de colas.
     */
    public static function sincronizarPendientes(iterable $validaciones): void
    {
        foreach ($validaciones as $val) {
            if ($val instanceof KycValidacion && $val->esTruora() && $val->truora_check_id && ! $val->estaFinalizada()
                && Cache::add('truora:sync:'.$val->id, 1, 30)) {
                self::sincronizar($val);
            }
        }
    }

    public static function propagar(KycValidacion $val): void
    {
        try {
            if ($persona = $val->validable) {
                $persona->forceFill([
                    'kyc_estatus' => KycValidacion::estatusConsolidado($persona) ?? $val->estatus,
                    'kyc_validado_en' => now(),
                ])->saveQuietly();
            }

            $val->operacion()->withoutGlobalScopes()->first()?->recalcularEstatus();
        } catch (\Throwable $e) {
            Log::warning('TRUORA: no se pudo propagar el estatus: '.$e->getMessage(), ['kyc_validacion_id' => $val->id]);
        }
    }

    private static function fallar(KycValidacion $val, string $detalle): bool
    {
        $val->forceFill([
            'estatus' => KycValidacion::ESTATUS_ERROR,
            'error_detalle' => $detalle,
            'procesado_en' => now(),
        ])->save();
        self::propagar($val);

        return false;
    }

    private static function notificar(KycValidacion $val): void
    {
        try {
            $persona = $val->validable;
            $nombre = $persona
                ? (trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')) ?: ('#'.$val->validable_id))
                : ('#'.$val->validable_id);

            NotificationDispatcher::notifyPermission(
                'validaciones.view',
                $val->empresa_id,
                new KycValidacionCompletadaNotification($val->id, $nombre, class_basename($val->validable_type), $val->estatus),
            );
        } catch (\Throwable $e) {
            Log::warning('TRUORA: no se pudo notificar: '.$e->getMessage(), ['kyc_validacion_id' => $val->id]);
        }
    }

    /** Quita blobs largos antes de guardar el JSON. */
    private static function depurar(array $datos): array
    {
        array_walk_recursive($datos, function (&$v) {
            if (is_string($v) && strlen($v) > 3000) {
                $v = '[omitido: '.strlen($v).' bytes]';
            }
        });

        return $datos;
    }
}
