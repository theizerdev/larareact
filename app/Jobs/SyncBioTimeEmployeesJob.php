<?php

namespace App\Jobs;

use App\Models\Empresa;
use App\Services\BioTimeSyncService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Sincroniza empleados de BioTime hacia la tabla empleados de Hoshō.
 * Actualiza los existentes y crea los nuevos automáticamente.
 */
class SyncBioTimeEmployeesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 1;

    public int $timeout = 180;

    public function __construct(public int $empresaId)
    {
    }

    public function handle(): void
    {
        $empresa = Empresa::find($this->empresaId);

        if ($empresa === null || ! $empresa->biotime_active) {
            return;
        }

        $lock = Cache::lock("biotime:sync_job:empresa_{$empresa->id}", 300);

        if (! $lock->get()) {
            Log::channel('biotime')->info("SyncBioTimeEmployeesJob omitido: ya hay una sincronización en ejecución para empresa #{$empresa->id}");

            return;
        }

        try {
            $service = BioTimeSyncService::for($empresa);
            // Sincronizar catálogos para mapear departamentos y cargos actualizados
            $service->syncCatalogs($empresa);
            // Sincronizar y aprovisionar empleados (crear nuevos y actualizar existentes)
            $res = $service->syncEmployees($empresa, forceProvision: true, forceUpdate: true);

            Log::channel('biotime')->info("Sincronización automática de empleados BioTime completada para empresa #{$empresa->id}", [
                'empresa_id' => $empresa->id,
                'resultado' => $res,
            ]);
        } catch (\Throwable $e) {
            Log::channel('biotime')->error("Error en SyncBioTimeEmployeesJob para empresa #{$empresa->id}: {$e->getMessage()}", [
                'empresa_id' => $empresa->id,
                'exception' => $e::class,
            ]);
        } finally {
            $lock->release();
        }
    }
}

