<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

/**
 * Helper compartido para lanzar la validación de identidad (KYC) contra JAAK
 * cuando se registra una persona: tanto desde los wizards públicos de
 * pre-registro como desde las altas del panel de administración.
 *
 * Diseño defensivo: si algo falla aquí NO debe romper el registro (que ya se
 * guardó y se le confirmó al usuario). Todo va envuelto en try/catch y el Job
 * se despacha con ->afterResponse().
 */
trait DispatchesKycValidacion
{
    /**
     * @param  Model  $persona  Empleado | ProveedorEmpleado | ProductorEmpleado | VisitaTemporal
     *                          (debe tener empresa_id, sucursal_id y la relación empresa())
     */
    protected function dispatchKycValidacion(Model $persona, ?string $curp = null): void
    {
        try {
            $empresa = $persona->empresa ?? null;

            if (! $empresa || ! $empresa->jaak_active || empty($empresa->jaak_api_key)) {
                return; // empresa sin KYC configurado: flujo idéntico al de siempre
            }

            if (! config('jaak.kyc_enabled', true)) {
                return;
            }

            $curp = $curp ?: ($persona->curp ?? null);

            $validacion = KycValidacion::create([
                'validable_type' => $persona->getMorphClass(),
                'validable_id' => $persona->getKey(),
                'empresa_id' => $persona->empresa_id,
                'sucursal_id' => $persona->sucursal_id,
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
