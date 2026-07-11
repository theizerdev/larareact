<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsAppApiIntegrationService;
use App\Models\Empresa;

class SyncAllCompaniesCommand extends Command
{
    protected $signature = 'companies:sync-whatsapp';
    protected $description = 'Sincronizar todas las empresas con la API de WhatsApp';

    public function handle()
    {
        $empresas = Empresa::whereNull('whatsapp_api_key')->get();
        
        if ($empresas->isEmpty()) {
            $this->info('Todas las empresas ya están sincronizadas');
            return 0;
        }
        
        $this->info("Sincronizando {$empresas->count()} empresas...");
        
        $service = new WhatsAppApiIntegrationService();
        $success = 0;
        $errors = 0;
        
        foreach ($empresas as $empresa) {
            $this->line("Procesando: {$empresa->nombre}");
            
            $apiKey = $service->createCompany($empresa);
            
            if ($apiKey) {
                $this->info("✅ {$empresa->nombre} - API Key: {$apiKey}");
                $success++;
            } else {
                $this->error("❌ {$empresa->nombre} - Error");
                $errors++;
            }
        }
        
        $this->info("\nResumen:");
        $this->info("Exitosas: {$success}");
        $this->info("Errores: {$errors}");
        
        return 0;
    }
}