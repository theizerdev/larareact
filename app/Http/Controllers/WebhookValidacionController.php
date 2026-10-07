<?php

namespace App\Http\Controllers;

use App\Models\FirmaDocumento;
use App\Models\KycValidacion;
use App\Services\DiditService;
use App\Services\Validaciones\DiditSincronizador;
use App\Services\Validaciones\FirmaService;
use App\Services\Validaciones\TruoraSincronizador;
use App\Services\ZapSignService;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Webhooks públicos de DIDIT y ZapSign. El contenido nunca se toma por bueno:
 * sólo identifica la sesión / documento (que debe existir en Hoshō) y se
 * vuelve a consultar su estado en la API del proveedor. Además se valida la
 * firma de DIDIT (X-Signature-V2) y el header secreto de ZapSign.
 */
class WebhookValidacionController extends Controller
{
    public function didit(Request $request)
    {
        // Webhook público: un valor que no sea texto (p. ej. un arreglo) se trata como vacío, no como error.
        $sessionId = $request->input('session_id');
        $sessionId = is_string($sessionId) ? $sessionId : '';

        if ($sessionId === '') {
            return response()->json(['ok' => true]);
        }

        $val = KycValidacion::withoutGlobalScopes()
            ->where('proveedor', KycValidacion::PROVEEDOR_DIDIT)
            ->where('didit_session_id', $sessionId)
            ->latest('id')
            ->first();

        if (! $val) {
            return response()->json(['ok' => true]); // sesión ajena a Hoshō
        }

        $empresa = $val->empresa()->withoutGlobalScopes()->first();
        $secreto = null;

        try {
            $secreto = $empresa?->didit_webhook_secret;
        } catch (DecryptException $e) {
            $secreto = null;
        }

        if (! empty($secreto) && ! DiditService::firmaWebhookValida(
            $request->getContent(),
            $request->header('X-Signature-V2'),
            $request->header('X-Timestamp'),
            $secreto,
        )) {
            Log::warning('DIDIT webhook con firma inválida', ['kyc_validacion_id' => $val->id]);

            return response()->json(['ok' => false], 401);
        }

        DiditSincronizador::sincronizar($val);

        return response()->json(['ok' => true]);
    }

    /**
     * Webhook de TRUORA ("Check finished"). Sólo sirve para avisar: el check_id debe
     * existir en Hoshō y el resultado se vuelve a pedir a la API con la llave de la empresa.
     */
    public function truora(Request $request)
    {
        $checkId = $request->input('check_id')
            ?? $request->input('check.check_id')
            ?? $request->input('data.check_id');
        $checkId = is_string($checkId) ? $checkId : '';

        if ($checkId === '') {
            return response()->json(['ok' => true]);
        }

        $val = KycValidacion::withoutGlobalScopes()
            ->where('proveedor', KycValidacion::PROVEEDOR_TRUORA)
            ->where('truora_check_id', $checkId)
            ->latest('id')
            ->first();

        if ($val) {
            TruoraSincronizador::sincronizar($val);
        }

        return response()->json(['ok' => true]);
    }

    public function zapsign(Request $request)
    {
        $docToken = $request->input('token');
        $docToken = is_string($docToken) ? $docToken : '';

        if ($docToken === '') {
            return response()->json(['ok' => true]);
        }

        $firma = FirmaDocumento::withoutGlobalScopes()
            ->where('zapsign_doc_token', $docToken)
            ->first();

        if (! $firma) {
            return response()->json(['ok' => true]);
        }

        $empresa = $firma->empresa()->withoutGlobalScopes()->first();
        $secreto = $empresa ? ZapSignService::secretoWebhookDe($empresa) : null;

        if (! $secreto || ! hash_equals($secreto, (string) $request->header('X-Hosho-Secret', ''))) {
            Log::warning('ZapSign webhook sin secreto válido', ['firma_documento_id' => $firma->id]);

            return response()->json(['ok' => false], 401);
        }

        FirmaService::sincronizar($firma);

        return response()->json(['ok' => true]);
    }
}
