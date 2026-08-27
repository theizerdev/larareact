<?php

namespace App\Jobs;

use App\Models\KycValidacion;
use App\Services\JaakService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Ejecuta el flujo KYC de JAAK para una persona pre-registrada y consolida el
 * resultado en la fila kyc_validaciones + la columna denormalizada kyc_estatus
 * de la propia persona.
 *
 * Se despacha con ->afterResponse() desde los *PreRegistroController: el wizard
 * ya respondió al usuario, esto corre justo después en el mismo worker. NUNCA
 * afecta al registro: cualquier fallo deja la validación en 'error'/'revision'.
 */
class ProcesarKycValidacion implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public int $backoff = 30;

    public int $timeout = 180;

    private float $inicio = 0.0;

    public function __construct(public KycValidacion $validacion)
    {
    }

    private function sinPresupuesto(): bool
    {
        return (microtime(true) - $this->inicio) > (int) config('jaak.kyc_time_budget', 120);
    }

    public function handle(): void
    {
        $this->inicio = microtime(true);

        /** @var KycValidacion|null $val */
        $val = KycValidacion::withoutGlobalScopes()->find($this->validacion->id);

        if (! $val || $val->estatus === KycValidacion::ESTATUS_PROCESANDO) {
            return; // ya no existe o hay otro worker con ella
        }

        if (! config('jaak.kyc_enabled', true)) {
            $this->marcarError($val, 'KYC deshabilitado globalmente (jaak.kyc_enabled).');

            return;
        }

        $persona = $val->validable; // morphTo

        if (! $persona) {
            $this->marcarError($val, 'La persona asociada ya no existe.');

            return;
        }

        $empresa = $persona->empresa ?? null;

        if (! $empresa || ! $empresa->jaak_active || empty($empresa->jaak_api_key)) {
            $this->marcarError($val, 'JAAK inactivo o sin App Key para la empresa.');

            return;
        }

        $val->update([
            'estatus' => KycValidacion::ESTATUS_PROCESANDO,
            'jaak_environment' => $empresa->jaak_environment ?? 'sandbox',
        ]);

        $rutas = $this->rutasImagenes($persona, $val->validable_type);
        $frontB64 = $this->imagenBase64($rutas['front'] ?? null);
        $backB64 = $this->imagenBase64($rutas['back'] ?? null);
        $selfieB64 = $this->imagenBase64($rutas['selfie'] ?? null);

        if (! $frontB64) {
            $this->consolidar($val, [
                'estatus' => KycValidacion::ESTATUS_REVISION,
                'observaciones' => ['No se encontró la imagen del frente de la identificación; no se pudo validar el documento.'],
            ]);

            return;
        }

        $jaak = new JaakService($empresa);
        $nombre = trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')) ?: 'Pre-registro';
        $accessToken = null;

        try {
            // Paso 1 - crear sesión
            $sesion = $jaak->crearSesionKyc($nombre);
            if (! $sesion['ok']) {
                $this->marcarError($val, 'No se pudo crear la sesión KYC: '.($sesion['error'] ?? 'desconocido'));

                return;
            }
            $shortKey = $sesion['data']['short_key'];
            $val->update(['jaak_short_key' => $shortKey]);

            // Paso 2 - access token
            $tok = $jaak->obtenerAccessToken($shortKey);
            if (! $tok['ok']) {
                $this->marcarError($val, 'No se pudo obtener el token de sesión: '.($tok['error'] ?? 'desconocido'));

                return;
            }
            $accessToken = $tok['data']['access_token'];
            $val->update(['jaak_session_id' => $tok['data']['session_id'] ?? null]);

            // Paso 4 - verificación de documento
            $doc = $jaak->verificarDocumento($accessToken, $frontB64, $backB64);
            $val->resultado_documento = $this->depurar($doc);

            // Paso 5 - OCR
            $datosOcr = [];
            if (! $this->sinPresupuesto()) {
                $ocr = $jaak->extraerOcr($accessToken, $frontB64, $backB64);
                $val->resultado_ocr = $this->depurar($ocr);
                $datosOcr = $this->extraerDatosOcr($ocr);
            }

            // Paso 6 - listas oficiales y negras (una llamada por servicio)
            if (! $this->sinPresupuesto()) {
                $val->resultado_listas = $this->consultarListas($jaak, $accessToken, $val->curp_capturada, $datosOcr);
            }

            // Paso 8 - comparación facial (rostro de la INE vs. selfie)
            $bio = null;
            if (! $this->sinPresupuesto()) {
                if (! empty($datosOcr['face_b64']) && $selfieB64) {
                    $bio = $jaak->compararRostros($accessToken, $datosOcr['face_b64'], $selfieB64);
                    $val->resultado_biometrico = $this->depurar($bio);
                } elseif ($selfieB64 && $frontB64) {
                    // Sin rostro recortado del OCR: comparar selfie contra el frente completo.
                    $bio = $jaak->compararRostros($accessToken, $frontB64, $selfieB64);
                    $val->resultado_biometrico = $this->depurar($bio);
                }
            }

            $this->consolidar($val, $this->evaluar($val, $doc, $bio, $datosOcr));
        } catch (\Throwable $e) {
            Log::error('ProcesarKycValidacion excepción: '.$e->getMessage(), ['kyc_validacion_id' => $val->id]);
            $this->marcarError($val, 'Excepción durante el proceso: '.$e->getMessage());
        } finally {
            if ($accessToken) {
                $jaak->finalizarSesion($accessToken);
            }
        }
    }

    public function failed(\Throwable $e): void
    {
        $val = KycValidacion::withoutGlobalScopes()->find($this->validacion->id);
        if ($val && ! $val->estaFinalizada()) {
            $this->marcarError($val, 'Job fallido: '.$e->getMessage());
        }
    }

    // ------------------------------------------------------------------
    // Listas (paso 6)
    // ------------------------------------------------------------------

    private function consultarListas(JaakService $jaak, string $token, ?string $curpCapturada, array $ocr): array
    {
        $curp = strtoupper(trim((string) ($curpCapturada ?: ($ocr['curp'] ?? ''))));
        $rfc = strtoupper(trim((string) ($ocr['rfc'] ?? '')));

        $person = array_filter([
            'firstName' => $ocr['nombres'] ?? null,
            'lastName' => $ocr['primer_apellido'] ?? null,
            'secondLastName' => $ocr['segundo_apellido'] ?? null,
            'birthDate' => $ocr['fecha_nacimiento'] ?? null,
            'nationality' => 'MEX',
        ]);

        $ineData = array_filter([
            'cic' => $ocr['cic'] ?? null,
            'ocr' => $ocr['ocr_number'] ?? null,
            'claveElector' => $ocr['clave_elector'] ?? null,
        ]);

        $identifications = array_filter([
            'curp' => $curp ?: null,
            'rfc' => $rfc ?: null,
            'ine' => $ineData ?: null,
        ]);

        $payload = array_filter([
            'person' => $person ?: null,
            'identifications' => $identifications ?: null,
        ]);

        // servicio => toggle a activar en esa llamada
        $plan = [];
        if ($curp !== '') {
            $plan['renapo'] = ['renapo' => ['curp' => true]];
        }
        if (! empty($ineData)) {
            $plan['ine'] = ['ine' => true];
        }
        $plan['ofac'] = ['ofac' => true];
        $plan['interpol'] = ['interpol' => true];
        if ($rfc !== '') {
            $plan['sat69b'] = ['sat' => ['sat69b' => true]];
        }

        $resultados = [];
        foreach ($plan as $nombre => $services) {
            if (empty($payload)) {
                $resultados[$nombre] = ['ok' => false, 'error' => 'sin datos para consultar'];

                continue;
            }
            $resultados[$nombre] = $this->depurar($jaak->investigarListas($token, $services, $payload));
        }

        return $resultados;
    }

    // ------------------------------------------------------------------
    // Consolidación / evaluación
    // ------------------------------------------------------------------

    private function evaluar(KycValidacion $val, array $doc, ?array $bio, array $ocr): array
    {
        $observaciones = [];
        $listas = $val->resultado_listas ?? [];

        // --- CURP (RENAPO) ---
        $curpValida = null;
        $renapo = $listas['renapo'] ?? null;
        if ($renapo && ($renapo['ok'] ?? false)) {
            $found = data_get($renapo, 'data.state.foundInService');
            $curpValida = ($found === true);
        }
        $typedCurp = strtoupper(trim((string) $val->curp_capturada));
        $ocrCurp = strtoupper(trim((string) ($ocr['curp'] ?? '')));
        if ($typedCurp !== '' && $ocrCurp !== '' && $typedCurp !== $ocrCurp) {
            $curpValida = false;
            $observaciones[] = "La CURP capturada ({$typedCurp}) no coincide con la de la identificación ({$ocrCurp}).";
        }
        if ($curpValida === false && empty($observaciones)) {
            $observaciones[] = 'La CURP no pudo validarse contra RENAPO.';
        }
        if ($curpValida === null) {
            $observaciones[] = 'No se pudo determinar la validez de la CURP (sin CURP o RENAPO no respondió).';
        }

        // --- INE / documento ---
        $ineValida = null;
        if ($doc['ok'] ?? false) {
            $docValidity = data_get($doc, 'data.state.documentValidity');
            $evaluation = strtoupper((string) data_get($doc, 'data.evaluation', ''));
            if ($docValidity === true || in_array($evaluation, ['APPROVED', 'OK', 'VALID', 'PASS', 'PASSED'], true)) {
                $ineValida = true;
            } elseif ($docValidity === false || in_array($evaluation, ['REJECTED', 'FAIL', 'FAILED', 'INVALID'], true)) {
                $ineValida = false;
            }
        }
        if ($ineValida === false) {
            $observaciones[] = 'La verificación del documento de identidad (INE) no fue aprobada por JAAK.';
        } elseif ($ineValida === null) {
            $observaciones[] = 'No se pudo determinar la validez del documento de identidad.';
        }

        // --- Rostro (One To One) ---
        $rostroCoincide = null;
        if ($bio && ($bio['ok'] ?? false)) {
            $isSame = data_get($bio, 'data.state.isSamePerson');
            $score = (float) data_get($bio, 'data.score', 0);
            $umbral = (float) config('jaak.face_match_threshold', 0.80);
            if ($isSame === true && $score >= $umbral) {
                $rostroCoincide = true;
            } elseif ($isSame === false || ($score > 0 && $score < $umbral)) {
                $rostroCoincide = false;
            }
        }
        if ($rostroCoincide === false) {
            $observaciones[] = 'El rostro de la selfie no coincide con la fotografía de la identificación.';
        } elseif ($rostroCoincide === null) {
            $observaciones[] = 'No se realizó o no se pudo determinar la comparación facial.';
        }

        // --- Listas negras ---
        $enListas = false;
        $determinado = false;
        foreach (['ofac', 'interpol', 'sat69b'] as $svc) {
            $r = $listas[$svc] ?? null;
            if ($r && ($r['ok'] ?? false)) {
                $determinado = true;
                if (data_get($r, 'data.state.foundInService') === true) {
                    $enListas = true;
                    $observaciones[] = "La persona aparece en la lista: ".strtoupper($svc).'.';
                }
            }
        }
        $enListasFinal = $determinado ? $enListas : null;

        // --- Estatus + score ---
        $flags = [
            'curp' => $curpValida,
            'ine' => $ineValida,
            'rostro' => $rostroCoincide,
            'sin_listas' => $enListasFinal === null ? null : ! $enListasFinal,
        ];
        $presentes = array_filter($flags, fn ($v) => $v !== null);
        $score = count($presentes) > 0
            ? round(100 * count(array_filter($presentes)) / count($presentes), 2)
            : null;

        if ($enListasFinal === true || $ineValida === false || $rostroCoincide === false || $curpValida === false) {
            $estatus = KycValidacion::ESTATUS_RECHAZADO;
        } elseif ($curpValida === true && $ineValida === true && $rostroCoincide === true && $enListasFinal === false) {
            $estatus = KycValidacion::ESTATUS_APROBADO;
        } else {
            $estatus = KycValidacion::ESTATUS_REVISION;
        }

        if ($estatus === KycValidacion::ESTATUS_APROBADO) {
            $observaciones = ['Todas las validaciones pasaron correctamente.'];
        }

        return [
            'estatus' => $estatus,
            'curp_valida' => $curpValida,
            'ine_valida' => $ineValida,
            'rostro_coincide' => $rostroCoincide,
            'en_listas' => $enListasFinal,
            'score_global' => $score,
            'observaciones' => $observaciones,
        ];
    }

    private function consolidar(KycValidacion $val, array $datos): void
    {
        $val->fill([
            'estatus' => $datos['estatus'] ?? KycValidacion::ESTATUS_REVISION,
            'curp_valida' => $datos['curp_valida'] ?? $val->curp_valida,
            'ine_valida' => $datos['ine_valida'] ?? $val->ine_valida,
            'rostro_coincide' => $datos['rostro_coincide'] ?? $val->rostro_coincide,
            'en_listas' => $datos['en_listas'] ?? $val->en_listas,
            'score_global' => $datos['score_global'] ?? $val->score_global,
            'observaciones' => isset($datos['observaciones'])
                ? implode("\n", array_unique($datos['observaciones']))
                : $val->observaciones,
            'procesado_en' => now(),
        ]);
        $val->save();

        $this->sincronizarPersona($val);
    }

    private function marcarError(KycValidacion $val, string $mensaje): void
    {
        $val->fill([
            'estatus' => KycValidacion::ESTATUS_ERROR,
            'error_detalle' => $mensaje,
            'procesado_en' => now(),
        ]);
        $val->save();

        $this->sincronizarPersona($val);
    }

    private function sincronizarPersona(KycValidacion $val): void
    {
        try {
            $persona = $val->validable;
            if ($persona) {
                $persona->forceFill([
                    'kyc_estatus' => $val->estatus,
                    'kyc_validado_en' => now(),
                ])->saveQuietly();
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo sincronizar kyc_estatus en la persona: '.$e->getMessage(), [
                'kyc_validacion_id' => $val->id,
            ]);
        }
    }

    // ------------------------------------------------------------------
    // Imágenes
    // ------------------------------------------------------------------

    /**
     * Campos de imagen por tipo de persona (rutas ya guardadas por los controladores).
     */
    private function rutasImagenes($persona, string $tipo): array
    {
        return match (class_basename($tipo)) {
            'Empleado' => [
                'front' => $persona->foto_documento,
                'back' => $persona->foto_documento_reverso,
                'selfie' => $persona->foto_empleado,
            ],
            'ProveedorEmpleado', 'ProductorEmpleado' => [
                'front' => $persona->documento_frontal,
                'back' => $persona->documento_reverso,
                'selfie' => $persona->foto_carnet,
            ],
            'VisitaTemporal' => [
                'front' => $persona->foto_documento,
                'back' => null,
                'selfie' => $persona->foto_carnet,
            ],
            default => [],
        };
    }

    /**
     * Normaliza los prefijos mezclados del proyecto (/storage/x, storage/x, x)
     * y devuelve el contenido del fichero en Base64 "pelón" (sin data: URI).
     */
    private function imagenBase64(?string $ruta): ?string
    {
        if (empty($ruta) || ! is_string($ruta)) {
            return null;
        }

        // URL absoluta: no la seguimos (evitamos SSRF / dependencias externas).
        if (Str::startsWith($ruta, ['http://', 'https://'])) {
            return null;
        }

        $rel = ltrim($ruta, '/');
        $rel = Str::after($rel, 'storage/'); // '/storage/empleados/x' -> 'empleados/x'
        $rel = ltrim($rel, '/');

        try {
            $disk = Storage::disk('public');
            if ($rel === '' || ! $disk->exists($rel)) {
                return null;
            }
            $bin = $disk->get($rel);

            return $bin !== null ? base64_encode($bin) : null;
        } catch (\Throwable $e) {
            Log::warning('KYC: no se pudo leer la imagen '.$ruta.': '.$e->getMessage());

            return null;
        }
    }

    // ------------------------------------------------------------------
    // OCR helpers
    // ------------------------------------------------------------------

    private function extraerDatosOcr(array $ocrResponse): array
    {
        if (! ($ocrResponse['ok'] ?? false)) {
            return [];
        }

        $d = $ocrResponse['data'] ?? [];

        return array_filter([
            'curp' => data_get($d, 'content.data.document.personalIdNumber'),
            'cic' => data_get($d, 'content.data.document.additionalNumber'),
            'ocr_number' => data_get($d, 'content.data.personal.extra.ocr'),
            'clave_elector' => data_get($d, 'content.data.document.number'),
            'rfc' => data_get($d, 'content.data.personal.extra.rfc'),
            'nombres' => data_get($d, 'content.data.personal.firstName'),
            'primer_apellido' => data_get($d, 'content.data.personal.surname'),
            'segundo_apellido' => data_get($d, 'content.data.personal.motherSurname'),
            'fecha_nacimiento' => data_get($d, 'content.data.personal.dateOfBirth'),
            'face_b64' => data_get($d, 'content.data.personal.face'),
        ], fn ($v) => $v !== null && $v !== '');
    }

    /**
     * Quita blobs Base64 gigantes antes de persistir la respuesta cruda en JSON.
     */
    private function depurar(array $res): array
    {
        $data = $res['data'] ?? [];

        array_walk_recursive($data, function (&$v, $k) {
            if (is_string($v) && strlen($v) > 3000) {
                $v = '[omitido: '.strlen($v).' bytes]';
            }
        });

        return [
            'ok' => $res['ok'] ?? false,
            'status' => $res['status'] ?? null,
            'error' => $res['error'] ?? null,
            'data' => $data,
        ];
    }
}
