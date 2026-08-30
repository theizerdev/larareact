<?php

namespace App\Jobs;

use App\Models\Empresa;
use App\Services\Tenancy\TenantManager;
use App\Services\WhatsAppService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProvisionTenantDatabaseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 180; // 3 minutes maximum
    public int $tries = 3;

    public int $empresaId;
    public array $empresaData;

    /**
     * Create a new job instance.
     */
    public function __construct(int $empresaId, array $empresaData = [])
    {
        $this->empresaId = $empresaId;
        $this->empresaData = $empresaData;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Iniciando aprovisionamiento de base de datos para Empresa ID: {$this->empresaId}...");

        try {
            // 1. Crear BD, correr migraciones tenant y sembrar sucursal/roles/cuentas
            TenantManager::provisionTenant($this->empresaId, $this->empresaData);

            Log::info("Base de datos provisionada exitosamente para Empresa ID: {$this->empresaId}");

            // 2. Inicializar instancia de WhatsApp si está configurada
            $empresa = Empresa::on('landlord')->find($this->empresaId);

            if ($empresa) {
                try {
                    $cleanName = $empresa->whatsapp_instance ?: ('empresa_' . $empresa->id);
                    WhatsAppService::forCompany($empresa)
                        ->setTimeout(5)
                        ->createInstance($cleanName);

                    Log::info("Instancia de WhatsApp inicializada: {$cleanName}");
                } catch (\Throwable $e) {
                    Log::warning("No se pudo crear la instancia inicial en el motor WhatsApp: " . $e->getMessage());
                }
            }
        } catch (\Throwable $e) {
            Log::error("Error durante el aprovisionamiento de la empresa {$this->empresaId}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
