<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Empresa;

class CheckWhatsAppConfig extends Command
{
    protected $signature = 'whatsapp:check-config {company_id=1}';
    protected $description = 'Verifica la configuración de WhatsApp para una empresa';

    public function handle()
    {
        $companyId = $this->argument('company_id');
        
        $empresa = Empresa::find($companyId);
        
        if (!$empresa) {
            $this->error("Empresa con ID {$companyId} no encontrada.");
            return 1;
        }
        
        $this->info("Configuración de WhatsApp para empresa: {$empresa->nombre}");
        $this->line("ID: {$empresa->id}");
        $this->line("Nombre: {$empresa->nombre}");
        
        if ($empresa->whatsapp_api_key) {
            $this->line("Longitud del whatsapp_api_key: " . strlen($empresa->whatsapp_api_key));
            $this->line("Preview del token: " . substr($empresa->whatsapp_api_key, 0, 50) . "...");
            $this->info("✅ Token de WhatsApp configurado");
        } else {
            $this->error("❌ No hay token de WhatsApp configurado");
        }
        
        if ($empresa->api_key) {
            $this->line("Longitud del api_key: " . strlen($empresa->api_key));
            $this->line("Preview del api_key: " . substr($empresa->api_key, 0, 50) . "...");
        } else {
            $this->line("No hay api_key configurado");
        }
        
        return 0;
    }
}