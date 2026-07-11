<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsAppApiIntegrationService;
use App\Models\Empresa;

class RegisterCompanyCommand extends Command
{
    protected $signature = 'company:register {id}';
    protected $description = 'Registrar empresa en la API de WhatsApp';

    public function handle()
    {
        $companyId = $this->argument('id');
        $this->info('Buscando empresa con ID: ' . $companyId);
        
        $empresa = Empresa::find($companyId);
        
        if (!$empresa) {
            $this->error('Empresa no encontrada con ID: ' . $companyId);
            $this->info('Empresas disponibles:');
            Empresa::all()->each(function($e) {
                $this->line("ID: {$e->id} - {$e->razon_social}");
            });
            return 1;
        }
        
        $this->info('Empresa encontrada: ' . $empresa->razon_social);
        $this->info('Email: ' . $empresa->email);
        $this->info('API Key actual: ' . ($empresa->api_key ?? 'No tiene'));
        
        try {
            $service = new WhatsAppApiIntegrationService();
            $this->info('Llamando a WhatsApp API...');
            $apiKey = $service->createCompany($empresa);
            
            if ($apiKey) {
                $this->info('✅ Empresa registrada exitosamente');
                $this->info('WhatsApp API Key: ' . $apiKey);
            } else {
                $this->error('❌ Error registrando empresa en WhatsApp API');
            }
        } catch (\Exception $e) {
            $this->error('Excepción: ' . $e->getMessage());
            $this->error('Archivo: ' . $e->getFile() . ':' . $e->getLine());
        }
        
        return 0;
    }
}