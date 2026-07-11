<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncWhatsAppCompany extends Command
{
    protected $signature = 'whatsapp:sync-company {empresa? : ID de la empresa a sincronizar (opcional, por defecto sincroniza todas las empresas activas)}';
    protected $description = 'Sincroniza empresa(s) con API de WhatsApp';

    public function handle()
    {
        $empresaId = $this->argument('empresa');
        
        if ($empresaId) {
            // Sincronizar una empresa específica
            $this->syncSingleCompany($empresaId);
        } else {
            // Sincronizar todas las empresas activas
            $this->syncAllCompanies();
        }
    }

    /**
     * Sincroniza una empresa específica
     */
    private function syncSingleCompany($empresaId)
    {
        $empresa = DB::table('empresas')->where('id', $empresaId)->first();
        
        if (!$empresa) {
            $this->error("❌ Empresa con ID {$empresaId} no encontrada en tabla empresas");
            return;
        }

        $this->syncCompanyToWhatsAppAPI($empresa);
    }

    /**
     * Sincroniza todas las empresas activas
     */
    private function syncAllCompanies()
    {
        $empresas = DB::table('empresas')->where('status', 1)->get();
        
        if ($empresas->isEmpty()) {
            $this->warn("⚠️ No hay empresas activas para sincronizar");
            return;
        }

        $this->info("🔄 Sincronizando {$empresas->count()} empresas activas...");
        
        foreach ($empresas as $empresa) {
            $this->syncCompanyToWhatsAppAPI($empresa);
            $this->newLine();
        }
        
        $this->info("✅ Sincronización completada");
    }

    /**
     * Sincroniza una empresa individual con la API de WhatsApp
     */
    private function syncCompanyToWhatsAppAPI($empresa)
    {
        // Verificar si la empresa tiene API key configurada
        if (empty($empresa->whatsapp_api_key)) {
            $nombreEmpresa = $empresa->nombre ?? $empresa->name ?? "Empresa ID {$empresa->id}";
            $this->warn("⚠️ La empresa {$nombreEmpresa} no tiene API Key de WhatsApp configurada");
            return;
        }

        try {
            // Usar la conexión existente a larawhatsapp
            $whatsappConnection = DB::connection('whatsapp_api');
            
            // Sincronizar con tabla companies en larawhatsapp
            $webhookUrl = config('whatsapp.api_url') . '/api/whatsapp/webhook';
            
            $whatsappConnection->table('companies')->updateOrInsert(
                ['id' => $empresa->id],
                [
                    'name' => $empresa->razon_social ?? $empresa->name ?? 'Empresa',
                    'apiKey' => $empresa->whatsapp_api_key,
                    'webhookUrl' => $webhookUrl,
                    'rateLimitPerMinute' => $empresa->whatsapp_rate_limit ?? 60,
                    'isActive' => 1,
                    'createdAt' => now(),
                    'updatedAt' => now()
                ]
            );

            $nombreEmpresa = $empresa->nombre ?? $empresa->name ?? "Empresa ID {$empresa->id}";
            $this->info("✅ Empresa {$nombreEmpresa} sincronizada con API de WhatsApp (larawhatsapp)");
            $this->info("🔑 API Key: " . substr($empresa->whatsapp_api_key, 0, 20) . "...");
            
        } catch (\Exception $e) {
            $this->error("❌ Error al sincronizar empresa: " . $e->getMessage());
            Log::error('Error sincronizando empresa con WhatsApp API', [
                'empresa_id' => $empresa->id,
                'error' => $e->getMessage()
            ]);
        }
    }
}