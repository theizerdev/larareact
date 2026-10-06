<?php

namespace App\Services\Validaciones;

use App\Models\FirmaDocumento;
use App\Models\OperacionValidacion;
use App\Models\ValidacionRegla;
use App\Notifications\FirmaDocumentoActualizadaNotification;
use App\Services\NotificationDispatcher;
use App\Services\ZapSignService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Documentos a firma (ZapSign) dentro de un folio de operación: envío desde la
 * plantilla de la regla, sincronización del estatus (webhook o consulta
 * manual), resguardo del PDF firmado en el disco privado y cancelación.
 * Nunca lanza: un fallo de ZapSign deja el documento en 'error'.
 */
class FirmaService
{
    /** Variables que Hoshō llena en plantillas DOCX de ZapSign. */
    public const VARIABLES = ['{{NOMBRE}}', '{{CURP}}', '{{DOCUMENTO}}', '{{SUCURSAL}}', '{{CARGO}}', '{{FECHA}}', '{{FOLIO}}', '{{EMPRESA}}'];

    /**
     * @param  string|null  $tipoDocumento  'ine' | 'pasaporte', para que ZapSign valide la
     *                                      identificación correcta si la regla lo pide
     */
    public static function iniciar(
        OperacionValidacion $operacion,
        Model $persona,
        ValidacionRegla $regla,
        ?string $tipoDocumento = null,
        ?string $paisDocumento = null,
    ): ?FirmaDocumento
    {
        try {
            $empresa = $persona->empresa ?? null;

            if (! $empresa || ! $empresa->zapsign_active || ! $regla->enviaFirma()) {
                return null;
            }

            $nombre = trim(($persona->nombres ?? '').' '.($persona->apellidos ?? '')) ?: 'Firmante';
            $nombreDocumento = ($regla->nombre_documento ?: 'Documento').' — '.$nombre.' ('.$operacion->folio.')';
            $pais = $persona->paisTelefono ?? null;

            $firma = FirmaDocumento::create([
                'operacion_id' => $operacion->id,
                'firmable_type' => $persona->getMorphClass(),
                'firmable_id' => $persona->getKey(),
                'empresa_id' => $persona->empresa_id,
                'sucursal_id' => $persona->sucursal_id,
                'zapsign_environment' => $empresa->zapsign_environment === 'sandbox' ? 'sandbox' : 'production',
                'zapsign_plantilla_token' => $regla->plantilla_zapsign,
                'nombre_documento' => mb_substr($nombreDocumento, 0, 255),
                'firmante_nombre' => $nombre,
                'firmante_email' => $persona->correo ?? null,
                'firmante_telefono' => $persona->telefono ?? null,
                'estatus' => FirmaDocumento::ESTATUS_PENDIENTE,
            ]);

            $zap = new ZapSignService($empresa);
            $res = $zap->crearDocumentoDesdePlantilla(
                $regla->plantilla_zapsign,
                $nombreDocumento,
                [
                    'nombre' => $nombre,
                    'email' => $persona->correo ?? null,
                    'telefono_pais' => $pais ? preg_replace('/\D/', '', (string) $pais->codigo_telefonico) : null,
                    'telefono' => $persona->telefono ? preg_replace('/\D/', '', (string) $persona->telefono) : null,
                ],
                [
                    '{{NOMBRE}}' => $nombre,
                    '{{CURP}}' => (string) ($persona->curp ?? ''),
                    '{{DOCUMENTO}}' => (string) ($persona->documento_identidad ?? ''),
                    '{{SUCURSAL}}' => (string) ($persona->sucursal?->nombre ?? ''),
                    '{{CARGO}}' => (string) ($persona->cargo?->nombre ?? ''),
                    '{{FECHA}}' => now()->format('d/m/Y'),
                    '{{FOLIO}}' => $operacion->folio,
                    '{{EMPRESA}}' => (string) ($empresa->nombre ?? ''),
                ],
                $operacion->folio,
                $operacion->token_seguimiento ? route('validacion.seguimiento', $operacion->token_seguimiento) : null,
                $regla->firma_valida_identidad ? [
                    'tipo' => $tipoDocumento ?: 'ine',
                    'pais' => $paisDocumento,
                    'numero' => $persona->documento_identidad ?? null,
                ] : null,
            );

            $signer = $res['data']['signers'][0] ?? [];

            if (! $res['ok'] || empty($res['data']['token']) || empty($signer['sign_url'])) {
                $firma->forceFill([
                    'estatus' => FirmaDocumento::ESTATUS_ERROR,
                    'error_detalle' => 'ZapSign no creó el documento: '.($res['error'] ?? 'respuesta incompleta')
                        .(isset($res['data']['detail']) ? ' — '.mb_substr((string) $res['data']['detail'], 0, 300) : ''),
                ])->save();
                $operacion->recalcularEstatus();

                return $firma;
            }

            $firma->forceFill([
                'zapsign_doc_token' => $res['data']['token'],
                'zapsign_signer_token' => $signer['token'] ?? null,
                'sign_url' => $signer['sign_url'],
                'enviado_en' => now(),
                'respuesta' => self::resumen($res['data']) + array_filter([
                    'validacion_identidad' => $regla->firma_valida_identidad
                        ? ($res['validacion_identidad'] ?? 'aplicada al crear')
                        : null,
                ]),
            ])->save();

            self::registrarWebhook($zap, $empresa, $firma);
            $operacion->recalcularEstatus();

            return $firma;
        } catch (\Throwable $e) {
            Log::error('No se pudo enviar el documento a firma: '.$e->getMessage(), [
                'operacion_id' => $operacion->id,
            ]);

            return null;
        }
    }

    /**
     * Consulta el documento en ZapSign y actualiza el estatus; al firmarse
     * descarga el PDF al disco privado. Devuelve true si cambió el estatus.
     */
    public static function sincronizar(FirmaDocumento $firma): bool
    {
        if (empty($firma->zapsign_doc_token) || in_array($firma->estatus, [FirmaDocumento::ESTATUS_FIRMADO, FirmaDocumento::ESTATUS_CANCELADO], true)) {
            return false;
        }

        $empresa = $firma->empresa()->withoutGlobalScopes()->first();

        if (! $empresa) {
            return false;
        }

        $res = (new ZapSignService($empresa))->detalleDocumento($firma->zapsign_doc_token);

        if (! $res['ok']) {
            if ($res['status'] === 404) {
                return self::cambiar($firma, FirmaDocumento::ESTATUS_CANCELADO, ['error_detalle' => 'El documento ya no existe en ZapSign.']);
            }

            return false;
        }

        $doc = $res['data'];
        $signer = collect($doc['signers'] ?? [])->firstWhere('token', $firma->zapsign_signer_token) ?? ($doc['signers'][0] ?? []);

        $estatus = match (true) {
            (bool) ($doc['deleted'] ?? false) => FirmaDocumento::ESTATUS_CANCELADO,
            ($doc['status'] ?? null) === 'refused' || ($signer['status'] ?? null) === 'refused' => FirmaDocumento::ESTATUS_RECHAZADO,
            ($doc['status'] ?? null) === 'signed' || ($signer['status'] ?? null) === 'signed' => FirmaDocumento::ESTATUS_FIRMADO,
            default => FirmaDocumento::ESTATUS_PENDIENTE,
        };

        $extra = ['respuesta' => self::resumen($doc)];

        if ($estatus === FirmaDocumento::ESTATUS_FIRMADO) {
            $extra['firmado_en'] = isset($signer['signed_at'])
                ? now()->parse($signer['signed_at'])->setTimezone(config('app.timezone'))
                : now();
            $extra['pdf_firmado_path'] = self::guardarPdf($firma, $doc['signed_file'] ?? null) ?? $firma->pdf_firmado_path;
        } elseif ($estatus === FirmaDocumento::ESTATUS_RECHAZADO) {
            $extra['rechazado_en'] = now();
        }

        return self::cambiar($firma, $estatus, $extra);
    }

    public static function cancelar(FirmaDocumento $firma): bool
    {
        if ($firma->estatus !== FirmaDocumento::ESTATUS_PENDIENTE && $firma->estatus !== FirmaDocumento::ESTATUS_ERROR) {
            return false;
        }

        $empresa = $firma->empresa()->withoutGlobalScopes()->first();

        if ($empresa && $firma->zapsign_doc_token) {
            $res = (new ZapSignService($empresa))->eliminarDocumento($firma->zapsign_doc_token);

            if (! $res['ok'] && $res['status'] !== 404) {
                return false;
            }
        }

        return self::cambiar($firma, FirmaDocumento::ESTATUS_CANCELADO);
    }

    private static function cambiar(FirmaDocumento $firma, string $estatus, array $extra = []): bool
    {
        $antes = $firma->estatus;
        $firma->forceFill(['estatus' => $estatus] + $extra)->save();
        $firma->operacion()->withoutGlobalScopes()->first()?->recalcularEstatus();

        if ($antes !== $estatus && in_array($estatus, [FirmaDocumento::ESTATUS_FIRMADO, FirmaDocumento::ESTATUS_RECHAZADO], true)) {
            try {
                NotificationDispatcher::notifyPermission(
                    'validaciones.view',
                    $firma->empresa_id,
                    new FirmaDocumentoActualizadaNotification($firma->id, $firma->operacion_id, $firma->firmante_nombre, $estatus),
                );
            } catch (\Throwable $e) {
                Log::warning('No se pudo notificar la firma: '.$e->getMessage(), ['firma_documento_id' => $firma->id]);
            }
        }

        return $antes !== $estatus;
    }

    /**
     * Descarga el PDF firmado (URL temporal de ZapSign, 60 min) al disco
     * privado. Sólo se aceptan URLs https de ZapSign / su bucket S3.
     */
    private static function guardarPdf(FirmaDocumento $firma, ?string $url): ?string
    {
        if (empty($url) || ! Str::startsWith($url, 'https://')) {
            return null;
        }

        $host = (string) parse_url($url, PHP_URL_HOST);

        if (! Str::endsWith($host, ['zapsign.com.br', 'zapsign.co', 'amazonaws.com'])) {
            Log::warning('ZapSign: host inesperado para el PDF firmado', ['host' => $host, 'firma_documento_id' => $firma->id]);

            return null;
        }

        try {
            $respuesta = Http::timeout(30)->get($url);

            if (! $respuesta->successful() || ! str_starts_with($respuesta->body(), '%PDF')) {
                return null;
            }

            $ruta = 'firmas/'.($firma->empresa_id ?? 0).'/'.Str::slug($firma->operacion?->folio ?? 'sin-folio').'-'.$firma->id.'.pdf';
            Storage::disk('local')->put($ruta, $respuesta->body());

            return $ruta;
        } catch (\Throwable $e) {
            Log::warning('No se pudo descargar el PDF firmado: '.$e->getMessage(), ['firma_documento_id' => $firma->id]);

            return null;
        }
    }

    private static function registrarWebhook(ZapSignService $zap, $empresa, FirmaDocumento $firma): void
    {
        try {
            $secreto = ZapSignService::secretoWebhookDe($empresa);

            if (! $secreto) {
                $secreto = Str::random(48);
                $empresa->forceFill(['zapsign_webhook_secret' => $secreto])->saveQuietly();
            }

            $res = $zap->crearWebhookDocumento($firma->zapsign_doc_token, route('webhooks.zapsign'), $secreto);

            if (! $res['ok']) {
                Log::warning('ZapSign: no se registró el webhook del documento', [
                    'firma_documento_id' => $firma->id,
                    'status' => $res['status'],
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('ZapSign: error al registrar el webhook: '.$e->getMessage(), ['firma_documento_id' => $firma->id]);
        }
    }

    /** Lo útil de la respuesta de ZapSign, sin URLs temporales firmadas. */
    private static function resumen(array $doc): array
    {
        return [
            'token' => $doc['token'] ?? null,
            'status' => $doc['status'] ?? null,
            'name' => $doc['name'] ?? null,
            'external_id' => $doc['external_id'] ?? null,
            'created_at' => $doc['created_at'] ?? null,
            'signers' => collect($doc['signers'] ?? [])->map(fn ($s) => [
                'status' => $s['status'] ?? null,
                'name' => $s['name'] ?? null,
                'signed_at' => $s['signed_at'] ?? null,
                'times_viewed' => $s['times_viewed'] ?? null,
                'last_view_at' => $s['last_view_at'] ?? null,
            ])->all(),
        ];
    }
}
