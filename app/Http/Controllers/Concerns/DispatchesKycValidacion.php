<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Helper compartido por los *PreRegistroController para lanzar la validación de
 * identidad (KYC) contra JAAK tras crear una persona en un wizard de pre-registro.
 *
 * Diseño defensivo: si algo falla aquí NO debe romper el pre-registro (que ya se
 * guardó y se le confirmó al usuario). Por eso todo va envuelto en try/catch y el
 * Job se despacha con ->afterResponse().
 */
trait DispatchesKycValidacion
{
    protected function dispatchKycValidacion(Model $persona, $preRegistro, ?string $curp = null): void
    {
        try {
            $empresa = $preRegistro->empresa ?? null;

            if (! $empresa || ! $empresa->jaak_active || empty($empresa->jaak_api_key)) {
                return; // empresa sin KYC configurado: flujo idéntico al de siempre
            }

            if (! config('jaak.kyc_enabled', true)) {
                return;
            }

            $validacion = KycValidacion::create([
                'validable_type' => $persona->getMorphClass(),
                'validable_id' => $persona->getKey(),
                'empresa_id' => $preRegistro->empresa_id,
                'sucursal_id' => $preRegistro->sucursal_id,
                'curp_capturada' => $curp ? strtoupper(trim($curp)) : null,
                'jaak_environment' => $empresa->jaak_environment ?? 'sandbox',
                'estatus' => KycValidacion::ESTATUS_PENDIENTE,
            ]);

            $persona->forceFill(['kyc_estatus' => KycValidacion::ESTATUS_PENDIENTE])->saveQuietly();

            ProcesarKycValidacion::dispatch($validacion)->afterResponse();
        } catch (\Throwable $e) {
            Log::error('No se pudo encolar la validación KYC: '.$e->getMessage(), [
                'persona' => $persona->getMorphClass().'#'.$persona->getKey(),
            ]);
        }
    }
}
