<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\ProcesarKycValidacion;
use App\Models\KycValidacion;
use App\Models\OperacionValidacion;
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
    /** Folios abiertos en esta petición, por entidad titular. */
    private array $operacionesKyc = [];

    /**
     * @param  Model  $persona  Empleado | ProveedorEmpleado | ProductorEmpleado | VisitaTemporal
     *                          (debe tener empresa_id, sucursal_id y la relación empresa())
     * @param  Model|null  $titular  Entidad dueña del folio de operación (p. ej. el Proveedor
     *                               de un pre-registro con varios empleados). Por defecto, la persona.
     */
    protected function dispatchKycValidacion(Model $persona, ?string $curp = null, ?Model $titular = null): void
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

            $operacion = $this->operacionKyc($titular ?? $persona);

            $validacion = KycValidacion::create([
                'validable_type' => $persona->getMorphClass(),
                'validable_id' => $persona->getKey(),
                'empresa_id' => $persona->empresa_id,
                'sucursal_id' => $persona->sucursal_id,
                'operacion_id' => $operacion?->id,
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

    /**
     * Folio de operación del titular: se abre uno por petición y se reutiliza
     * para todas las personas del mismo titular. Si no se puede abrir, la
     * validación sigue sin folio (nunca bloquea el registro).
     */
    private function operacionKyc(Model $titular): ?OperacionValidacion
    {
        $clave = $titular->getMorphClass().'#'.$titular->getKey();

        if (isset($this->operacionesKyc[$clave])) {
            return $this->operacionesKyc[$clave];
        }

        try {
            $panel = str_contains(static::class, '\\Admin\\');

            return $this->operacionesKyc[$clave] = OperacionValidacion::abrir(
                $titular,
                $panel ? OperacionValidacion::TIPO_ALTA : OperacionValidacion::TIPO_PRERREGISTRO,
                $panel ? OperacionValidacion::ORIGEN_PANEL : OperacionValidacion::ORIGEN_PRERREGISTRO,
                auth()->id(),
            );
        } catch (\Throwable $e) {
            Log::error('No se pudo abrir el folio de operación: '.$e->getMessage(), [
                'titular' => $clave,
            ]);

            return null;
        }
    }
}
