<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppApiIntegrationService;
use Illuminate\Console\Command;

class SyncWhatsAppCompanies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:sync-companies 
                            {--all : Sincronizar todas las empresas, incluso las que ya tienen API key}
                            {--empresa= : ID de empresa específica a sincronizar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza las empresas de Laravel con la API de WhatsApp multi-empresa';

    /**
     * Execute the console command.
     */
    public function handle(WhatsAppApiIntegrationService $whatsappService)
    {
        $this->info('🔄 Iniciando sincronización de empresas con WhatsApp API...');
        $this->newLine();

        // Si se especifica una empresa
        if ($empresaId = $this->option('empresa')) {
            $empresa = Empresa::find($empresaId);
            
            if (!$empresa) {
                $this->error("❌ Empresa con ID {$empresaId} no encontrada.");
                return 1;
            }

            $this->syncEmpresa($empresa, $whatsappService);
            return 0;
        }

        // Obtener empresas a sincronizar
        $query = Empresa::query();
        
        if (!$this->option('all')) {
            $query->where(function ($q) {
                $q->whereNull('whatsapp_api_key')
                  ->orWhere('whatsapp_api_key', '');
            });
        }

        $empresas = $query->get();

        if ($empresas->isEmpty()) {
            $this->info('✅ Todas las empresas ya tienen API key de WhatsApp configurada.');
            return 0;
        }

        $this->info("📋 Empresas a sincronizar: {$empresas->count()}");
        $this->newLine();

        $bar = $this->output->createProgressBar($empresas->count());
        $bar->start();

        $success = 0;
        $failed = 0;

        foreach ($empresas as $empresa) {
            $result = $this->syncEmpresa($empresa, $whatsappService, false);
            
            if ($result) {
                $success++;
            } else {
                $failed++;
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✅ Sincronización completada:");
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['Total', $empresas->count()],
                ['Exitosas', $success],
                ['Fallidas', $failed],
            ]
        );

        return $failed > 0 ? 1 : 0;
    }

    /**
     * Sincroniza una empresa individual
     */
    private function syncEmpresa(Empresa $empresa, WhatsAppApiIntegrationService $service, bool $verbose = true): bool
    {
        if ($verbose) {
            $this->info("🔄 Sincronizando: {$empresa->razon_social} (ID: {$empresa->id})");
        }

        $apiKey = $service->createCompany($empresa);

        if ($apiKey) {
            if ($verbose) {
                $this->info("  ✅ API Key generada: {$apiKey}");
                $this->info("  📱 WhatsApp activo: " . ($empresa->whatsapp_active ? 'Sí' : 'No (pendiente conexión)'));
            }
            return true;
        }

        if ($verbose) {
            $this->error("  ❌ Error al sincronizar empresa");
        }
        return false;
    }
}
