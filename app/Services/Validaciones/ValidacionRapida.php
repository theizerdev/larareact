<?php

namespace App\Services\Validaciones;

use App\Models\Empresa;
use App\Models\KycValidacion;
use App\Models\Prevalidacion;
use App\Models\Productor;
use App\Models\Proveedor;
use App\Services\DiditService;
use App\Services\TruoraService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Validaciones sin foto, cada una con el proveedor que mejor la resuelve:
 *
 *  - RFC de la empresa → TRUORA, check type=company (situación del negocio,
 *    antecedentes legales, penales, fiscales y en medios). Tarda unos minutos.
 *  - Nombre + CURP de la persona → DIDIT, Database Validation `mex_curp`
 *    contra RENAPO. Respuesta inmediata; el nombre se compara aquí contra el
 *    que devuelve RENAPO.
 *
 * Se usan desde el formulario de alta (Prevalidacion, antes de guardar) y
 * desde el menú Validar de un registro ya guardado (KycValidacion con alcance).
 * Ningún método lanza excepciones.
 */
class ValidacionRapida
{
    /** RFC de persona moral (12) o física (13), con fecha válida en el formato. */
    private const RFC_REGEX = '/^[A-ZÑ&]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{2}[A\d]$/u';

    private const CURP_REGEX = '/^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HMX](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/';

    /** Partículas que no cuentan al comparar nombres. */
    private const PARTICULAS = ['DE', 'DEL', 'LA', 'LAS', 'LOS', 'Y', 'MC', 'VAN', 'VON', 'DA', 'DI'];

    public static function normalizarRfc(?string $rfc): string
    {
        return (string) preg_replace('/[\s\-]/u', '', mb_strtoupper(trim((string) $rfc)));
    }

    public static function rfcValido(string $rfc): bool
    {
        return (bool) preg_match(self::RFC_REGEX, $rfc);
    }

    public static function curpValida(string $curp): bool
    {
        return (bool) preg_match(self::CURP_REGEX, $curp);
    }

    public static function truoraDisponible(Empresa $empresa): bool
    {
        return (bool) $empresa->truora_active && TruoraService::tokenDe($empresa) && config('truora.enabled', true);
    }

    public static function diditDisponible(Empresa $empresa): bool
    {
        return (bool) $empresa->didit_active && DiditService::tokenDe($empresa) && config('didit.enabled', true);
    }

    /** Proveedores y socios comerciales son empresas: tienen RFC y un responsable. */
    public static function esEmpresa(Model $registro): bool
    {
        return $registro instanceof Proveedor || $registro instanceof Productor;
    }

    /** Nombre de la persona que se valida con la CURP (el responsable, en una empresa). */
    public static function nombreDe(Model $registro): string
    {
        if (self::esEmpresa($registro)) {
            return trim((string) $registro->responsable);
        }

        return trim(($registro->nombres ?? '').' '.($registro->apellidos ?? ''));
    }

    // ---------------------------------------------------------------------
    // CURP + nombre (DIDIT → RENAPO)
    // ---------------------------------------------------------------------

    /**
     * Consulta la CURP en RENAPO y compara el nombre capturado.
     *
     * @return array{estatus: string, curp_valida: ?bool, observaciones: ?string, error_detalle: ?string, referencia: ?string, resultado: array}
     */
    public static function consultarCurp(Empresa $empresa, string $curp, string $nombre, string $vendorData): array
    {
        $res = (new DiditService($empresa))->validarCurpRenapo($curp, $vendorData);

        if (! $res['ok']) {
            $detalle = match (true) {
                $res['status'] === 403 => 'DIDIT rechazó la consulta (saldo insuficiente o servicio no habilitado para la cuenta).',
                $res['status'] === 401 => 'DIDIT rechazó la API Key de la empresa.',
                $res['status'] === 0 => 'No se pudo conectar con DIDIT. Intenta de nuevo en unos minutos.',
                $res['status'] === 502 => 'RENAPO no respondió a través de DIDIT. Intenta de nuevo más tarde (no se cobra).',
                default => 'DIDIT no pudo validar la CURP: '.self::mensajeDidit($res),
            };

            return self::resultadoCurp(KycValidacion::ESTATUS_ERROR, null, null, $detalle, null, $res['data']);
        }

        $datos = $res['data'];
        $db = is_array($datos['database_validation'] ?? null) ? $datos['database_validation'] : $datos;
        $referencia = is_string($datos['request_id'] ?? null) ? $datos['request_id'] : null;

        $servicio = collect(is_array($db['validations'] ?? null) ? $db['validations'] : [])
            ->first(fn ($v) => is_array($v) && ($v['service_id'] ?? 'mex_curp') === 'mex_curp');
        $codigo = is_array($servicio) ? strtoupper((string) ($servicio['outcome_code'] ?? '')) : '';
        $fuente = is_array($servicio['source_data'] ?? null) ? $servicio['source_data'] : [];

        if ($codigo === '') {
            $codigo = match ($db['match_type'] ?? null) {
                'full_match' => 'MATCH',
                'partial_match' => 'PARTIAL_MATCH',
                'no_match' => 'NO_MATCH',
                default => '',
            };
        }

        $rechazo = match ($codigo) {
            'NO_MATCH', 'DOCUMENT_NOT_FOUND' => 'La CURP no existe en RENAPO.',
            'INVALID_DOCUMENT_FORMAT', 'INVALID_INPUT' => 'RENAPO rechazó la CURP por formato inválido.',
            'DECEASED' => 'RENAPO reporta la CURP como baja por defunción.',
            default => null,
        };

        if ($rechazo) {
            return self::resultadoCurp(KycValidacion::ESTATUS_RECHAZADO, false, $rechazo, null, $referencia, $datos);
        }

        if (in_array($codigo, ['INCONCLUSIVE', 'DOCUMENT_SUPERSEDED'], true)) {
            return self::resultadoCurp(KycValidacion::ESTATUS_REVISION, null, 'RENAPO no pudo confirmar la CURP ('.$codigo.'). Revisa manualmente.', null, $referencia, $datos);
        }

        if (! in_array($codigo, ['MATCH', 'PARTIAL_MATCH'], true)) {
            return self::resultadoCurp(KycValidacion::ESTATUS_ERROR, null, null, 'RENAPO no respondió ('.($codigo ?: 'sin resultado').'). Intenta de nuevo más tarde.', $referencia, $datos);
        }

        // La CURP existe: ahora el nombre capturado contra el de RENAPO.
        $nombreRenapo = trim((string) ($fuente['full_name'] ?? ''))
            ?: trim(($fuente['first_name'] ?? '').' '.($fuente['last_name'] ?? ''));
        $estatusCurp = strtoupper(trim((string) ($fuente['curp_status'] ?? '')));
        $notas = ['La CURP existe en RENAPO.'];

        if ($nombreRenapo === '') {
            $estatus = KycValidacion::ESTATUS_REVISION;
            $notas[] = 'RENAPO no devolvió el nombre para compararlo; revisa manualmente.';
        } else {
            $comparacion = self::compararNombres($nombre, $nombreRenapo);
            $estatus = match ($comparacion) {
                'igual' => KycValidacion::ESTATUS_APROBADO,
                'parcial' => KycValidacion::ESTATUS_REVISION,
                default => KycValidacion::ESTATUS_RECHAZADO,
            };
            $notas[] = match ($comparacion) {
                'igual' => 'El nombre coincide con RENAPO.',
                'parcial' => 'El nombre coincide sólo en parte con RENAPO ('.$nombreRenapo.'). Revisa la captura.',
                default => 'El nombre capturado NO corresponde a esta CURP. RENAPO: '.$nombreRenapo.'.',
            };
        }

        if (str_starts_with($estatusCurp, 'BD')) {
            $estatus = KycValidacion::ESTATUS_RECHAZADO;
            $notas[] = 'RENAPO reporta la CURP como baja por defunción ('.$estatusCurp.').';
        } elseif (str_starts_with($estatusCurp, 'B') && $estatus === KycValidacion::ESTATUS_APROBADO) {
            $estatus = KycValidacion::ESTATUS_REVISION;
            $notas[] = 'RENAPO reporta la CURP dada de baja ('.$estatusCurp.').';
        }

        return self::resultadoCurp($estatus, true, implode(' ', $notas), null, $referencia, $datos);
    }

    /**
     * 'igual' si los dos nombres tienen las mismas palabras (sin acentos, sin
     * importar el orden ni partículas como DE/LA); 'parcial' si a uno sólo le
     * faltan palabras del otro (con al menos dos en común); 'distinto' si hay
     * alguna palabra diferente.
     */
    public static function compararNombres(string $capturado, string $renapo): string
    {
        $a = self::palabras($capturado);
        $b = self::palabras($renapo);

        if ($a === [] || $b === []) {
            return 'distinto';
        }

        if (array_diff($a, $b) === [] && array_diff($b, $a) === []) {
            return 'igual';
        }

        // Sólo faltan palabras (p. ej. sin segundo nombre o segundo apellido), ninguna distinta.
        $subconjunto = array_diff($a, $b) === [] || array_diff($b, $a) === [];

        return $subconjunto && count(array_intersect($a, $b)) >= 2 ? 'parcial' : 'distinto';
    }

    /** @return list<string> */
    private static function palabras(string $nombre): array
    {
        $limpio = Str::upper(Str::ascii($nombre));
        $limpio = (string) preg_replace('/[^A-Z ]/', ' ', $limpio);
        $palabras = array_filter(explode(' ', $limpio), fn ($p) => $p !== '' && ! in_array($p, self::PARTICULAS, true));

        return array_values(array_unique($palabras));
    }

    private static function resultadoCurp(string $estatus, ?bool $curpValida, ?string $observaciones, ?string $error, ?string $referencia, array $datos): array
    {
        return [
            'estatus' => $estatus,
            'curp_valida' => $curpValida,
            'observaciones' => $observaciones,
            'error_detalle' => $error,
            'referencia' => $referencia,
            'resultado' => TruoraSincronizador::depurar(['renapo' => $datos]),
        ];
    }

    private static function mensajeDidit(array $res): string
    {
        $errores = $res['data']['validation_errors'] ?? $res['data']['errors'] ?? null;

        if (is_array($errores) && $errores !== []) {
            $primero = reset($errores);

            if (is_array($primero)) {
                return (string) ($primero['message'] ?? $primero['code'] ?? json_encode($primero));
            }

            return is_string($primero) ? $primero : json_encode($errores);
        }

        return (string) ($res['error'] ?? 'HTTP '.$res['status']);
    }

    // ---------------------------------------------------------------------
    // Prevalidaciones (formulario de alta, antes de guardar)
    // ---------------------------------------------------------------------

    /** Valida nombre + CURP en RENAPO y guarda la prevalidación (síncrona). */
    public static function prevalidarCurp(Empresa $empresa, string $curp, string $nombre, ?string $entidad, ?int $userId, ?int $sucursalId): Prevalidacion
    {
        $pre = Prevalidacion::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursalId,
            'user_id' => $userId,
            'tipo' => Prevalidacion::TIPO_CURP,
            'entidad' => $entidad,
            'proveedor' => KycValidacion::PROVEEDOR_DIDIT,
            'dato' => $curp,
            'nombre' => mb_substr($nombre, 0, 255),
            'estatus' => KycValidacion::ESTATUS_PROCESANDO,
        ]);

        $r = self::consultarCurp($empresa, $curp, $nombre, 'hosho:previa:'.$pre->id);

        $pre->forceFill([
            'estatus' => $r['estatus'],
            'referencia' => $r['referencia'],
            'resultado' => $r['resultado'] + ['curp_valida' => $r['curp_valida']],
            'observaciones' => $r['observaciones'],
            'error_detalle' => $r['error_detalle'],
            'procesado_en' => now(),
        ])->save();

        return $pre;
    }

    /** Abre el check de la empresa en TRUORA; el resultado se consulta después. */
    public static function prevalidarRfc(Empresa $empresa, string $rfc, ?string $razonSocial, ?string $entidad, ?int $userId, ?int $sucursalId): Prevalidacion
    {
        $pre = Prevalidacion::create([
            'empresa_id' => $empresa->id,
            'sucursal_id' => $sucursalId,
            'user_id' => $userId,
            'tipo' => Prevalidacion::TIPO_RFC,
            'entidad' => $entidad,
            'proveedor' => KycValidacion::PROVEEDOR_TRUORA,
            'dato' => $rfc,
            'nombre' => $razonSocial ? mb_substr($razonSocial, 0, 255) : null,
            'estatus' => KycValidacion::ESTATUS_PENDIENTE,
        ]);

        $res = (new TruoraService($empresa))->crearCheckEmpresa($rfc, $razonSocial, 'hosho:previa:'.$pre->id);
        $checkId = $res['data']['check']['check_id'] ?? $res['data']['check_id'] ?? null;

        if (! $res['ok'] || ! $checkId) {
            $pre->forceFill([
                'estatus' => KycValidacion::ESTATUS_ERROR,
                'error_detalle' => 'No se pudo crear la consulta en TRUORA: '.($res['error'] ?? 'respuesta incompleta'),
                'procesado_en' => now(),
            ])->save();

            return $pre;
        }

        $pre->forceFill(['referencia' => $checkId])->save();
        self::sincronizarPrevalidacion($pre, true);

        return $pre;
    }

    /**
     * Consulta en TRUORA un check de empresa aún abierto (a lo más una vez
     * cada 10 s por prevalidación) y guarda el veredicto cuando termina.
     */
    public static function sincronizarPrevalidacion(Prevalidacion $pre, bool $forzar = false): void
    {
        if ($pre->estaFinalizada() || $pre->proveedor !== KycValidacion::PROVEEDOR_TRUORA || empty($pre->referencia)) {
            return;
        }

        if (! $forzar && ! Cache::add('prevalidacion:sync:'.$pre->id, 1, 10)) {
            return;
        }

        $empresa = Empresa::withoutGlobalScopes()->find($pre->empresa_id);

        if (! $empresa) {
            return;
        }

        $servicio = new TruoraService($empresa);
        $res = $servicio->getCheck($pre->referencia);

        if (! $res['ok']) {
            return; // se reintenta en la próxima consulta
        }

        $check = $res['data']['check'] ?? $res['data'];
        $estado = strtolower((string) ($check['status'] ?? ''));

        if ($estado === '' || in_array($estado, TruoraSincronizador::EN_CURSO, true)) {
            return;
        }

        if ($estado !== 'completed') {
            $pre->forceFill([
                'estatus' => KycValidacion::ESTATUS_ERROR,
                'error_detalle' => 'La consulta de TRUORA terminó con estado "'.$estado.'".',
                'procesado_en' => now(),
            ])->save();

            return;
        }

        $detalle = $servicio->getDetalle($pre->referencia);
        $veredicto = TruoraSincronizador::evaluar($check, TruoraService::scoreMinimoDe($empresa));

        $pre->forceFill([
            'estatus' => $veredicto['estatus'],
            'score' => $veredicto['score'] !== null ? round($veredicto['score'], 2) : null,
            'resultado' => TruoraSincronizador::depurar(['check' => $check, 'details' => $detalle['ok'] ? $detalle['data'] : []]),
            'observaciones' => $veredicto['observacion'],
            'error_detalle' => null,
            'procesado_en' => now(),
        ])->save();
    }

    /** Lo que el formulario necesita para pintar el resultado. */
    public static function aRespuesta(Prevalidacion $pre): array
    {
        return [
            'id' => $pre->id,
            'tipo' => $pre->tipo,
            'proveedor' => $pre->proveedor,
            'dato' => $pre->dato,
            'estatus' => $pre->estatus,
            'finalizada' => $pre->estaFinalizada(),
            'score' => $pre->score !== null ? (float) $pre->score : null,
            'observaciones' => $pre->observaciones,
            'error_detalle' => $pre->error_detalle,
        ];
    }
}
