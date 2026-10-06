<?php

namespace App\Services\Validaciones;

use App\Models\KycValidacion;
use App\Notifications\KycValidacionCompletadaNotification;
use App\Services\DiditService;
use App\Services\NotificationDispatcher;
use Illuminate\Support\Facades\Log;

/**
 * Validación de identidad con DIDIT (página hospedada): abre la sesión y
 * lleva la decisión de DIDIT a la fila kyc_validaciones, a la persona y al
 * folio. La decisión siempre se vuelve a pedir a la API: el webhook sólo
 * avisa que hay algo nuevo, nunca se confía en su contenido.
 */
class DiditSincronizador
{
    private const ESTATUS = [
        'Approved' => KycValidacion::ESTATUS_APROBADO,
        'Declined' => KycValidacion::ESTATUS_RECHAZADO,
        'In Review' => KycValidacion::ESTATUS_REVISION,
        'Abandoned' => KycValidacion::ESTATUS_ERROR,
        'Expired' => KycValidacion::ESTATUS_ERROR,
        'Kyc Expired' => KycValidacion::ESTATUS_ERROR,
    ];

    /**
     * Crea la sesión hospedada de DIDIT para una validación ya guardada.
     * Si falla, la validación queda en 'error' con el detalle; nunca lanza.
     */
    public static function iniciar(KycValidacion $val, ?string $callbackUrl = null): bool
    {
        $empresa = $val->empresa()->withoutGlobalScopes()->first();

        if (! $empresa) {
            return false;
        }

        $res = (new DiditService($empresa))->createSession('kyc:'.$val->id, [
            'callback' => $callbackUrl,
            'language' => 'es',
            'metadata' => array_filter([
                'kyc_validacion_id' => $val->id,
                'folio' => $val->operacion()->withoutGlobalScopes()->value('folio'),
            ]),
        ]);

        if (! $res['ok'] || empty($res['data']['session_id']) || empty($res['data']['url'])) {
            $val->forceFill([
                'estatus' => KycValidacion::ESTATUS_ERROR,
                'error_detalle' => 'No se pudo crear la sesión DIDIT: '.($res['error'] ?? 'respuesta incompleta'),
                'procesado_en' => now(),
            ])->save();
            self::propagar($val);

            return false;
        }

        $val->forceFill([
            'didit_session_id' => $res['data']['session_id'],
            'didit_url' => $res['data']['url'],
            'didit_estatus' => $res['data']['status'] ?? 'Not Started',
        ])->save();

        return true;
    }

    /**
     * Consulta la decisión en DIDIT y la consolida. Devuelve true si cambió algo.
     */
    public static function sincronizar(KycValidacion $val): bool
    {
        if (! $val->esDidit() || empty($val->didit_session_id)) {
            return false;
        }

        $empresa = $val->empresa()->withoutGlobalScopes()->first();

        if (! $empresa) {
            return false;
        }

        $res = (new DiditService($empresa))->getSessionDecision($val->didit_session_id);

        if (! $res['ok']) {
            Log::warning('DIDIT: no se pudo leer la decisión', [
                'kyc_validacion_id' => $val->id,
                'status' => $res['status'],
            ]);

            return false;
        }

        return self::aplicarDecision($val, $res['data']);
    }

    public static function aplicarDecision(KycValidacion $val, array $decision): bool
    {
        $estatusDidit = (string) ($decision['status'] ?? '');

        if ($estatusDidit === '' || ($estatusDidit === $val->didit_estatus && $val->estaFinalizada())) {
            return false;
        }

        $documento = self::primero($decision, 'id_verifications', 'id_verification');
        $vida = self::primero($decision, 'liveness_checks', 'liveness');
        $rostro = self::primero($decision, 'face_matches', 'face_match');
        $aml = self::primero($decision, 'aml_screenings', 'aml');

        $nuevo = self::ESTATUS[$estatusDidit] ?? KycValidacion::ESTATUS_PENDIENTE;
        $estatusAnterior = $val->estatus;

        $observaciones = [];
        foreach (['Documento' => $documento, 'Prueba de vida' => $vida, 'Rostro' => $rostro, 'Listas AML' => $aml] as $etiqueta => $parte) {
            foreach ((array) ($parte['warnings'] ?? []) as $aviso) {
                $texto = is_array($aviso) ? ($aviso['short_description'] ?? $aviso['risk'] ?? null) : $aviso;
                if ($texto) {
                    $observaciones[] = $etiqueta.': '.$texto;
                }
            }
        }

        if (in_array($estatusDidit, ['Abandoned', 'Expired', 'Kyc Expired'], true)) {
            $observaciones[] = 'La persona no terminó la verificación en DIDIT ('.$estatusDidit.').';
        }

        $tipoDoc = strtolower((string) ($documento['document_type'] ?? ''));

        $val->forceFill([
            'didit_estatus' => $estatusDidit,
            'estatus' => $nuevo,
            'ine_valida' => self::bandera($documento),
            'rostro_coincide' => self::bandera($rostro),
            'en_listas' => $aml ? ((int) ($aml['total_hits'] ?? 0) > 0) : null,
            'score_global' => isset($rostro['score']) && is_numeric($rostro['score']) ? round((float) $rostro['score'], 2) : null,
            'pais_documento' => $documento['issuing_state'] ?? $val->pais_documento,
            'tipo_documento' => $val->tipo_documento
                ?? (str_contains($tipoDoc, 'passport') ? KycValidacion::DOCUMENTO_PASAPORTE : ($tipoDoc !== '' ? 'identificacion' : null)),
            'resultado_documento' => $documento ? self::depurar($documento) : null,
            'resultado_ocr' => $documento ? self::depurar(array_intersect_key($documento, array_flip([
                'first_name', 'last_name', 'full_name', 'document_number', 'personal_number', 'date_of_birth',
                'expiration_date', 'nationality', 'gender', 'issuing_state', 'issuing_state_name', 'document_type',
            ]))) : null,
            'resultado_biometrico' => self::depurar(array_filter(['liveness' => $vida, 'face_match' => $rostro])),
            'resultado_listas' => $aml ? self::depurar($aml) : null,
            'observaciones' => $observaciones ? implode("\n", array_unique($observaciones)) : null,
            'procesado_en' => in_array($nuevo, [KycValidacion::ESTATUS_PENDIENTE, KycValidacion::ESTATUS_PROCESANDO], true) ? null : now(),
        ])->save();

        self::propagar($val);

        // También avisa si una revisión manual en DIDIT cambia el resultado.
        if ($val->estaFinalizada() && $estatusAnterior !== $val->estatus) {
            self::notificar($val);
        }

        return true;
    }

    /** Lleva el estatus a la persona y al folio. */
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
            Log::warning('DIDIT: no se pudo propagar el estatus: '.$e->getMessage(), ['kyc_validacion_id' => $val->id]);
        }
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
            Log::warning('DIDIT: no se pudo notificar: '.$e->getMessage(), ['kyc_validacion_id' => $val->id]);
        }
    }

    /** DIDIT v3 manda listas (id_verifications[]); v2 mandaba un objeto (id_verification). */
    private static function primero(array $decision, string $plural, string $singular): ?array
    {
        $lista = $decision[$plural] ?? null;

        if (is_array($lista) && array_is_list($lista) && isset($lista[0]) && is_array($lista[0])) {
            return $lista[0];
        }

        $uno = $decision[$singular] ?? null;

        return is_array($uno) && $uno !== [] ? $uno : null;
    }

    private static function bandera(?array $parte): ?bool
    {
        return match ($parte['status'] ?? null) {
            'Approved' => true,
            'Declined' => false,
            default => null,
        };
    }

    /** Quita blobs largos (imágenes en base64) antes de guardar el JSON. */
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
