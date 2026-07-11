<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncAllWhatsAppCompanies extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:sync-all-companies 
                            {--force : Forzar sincronización incluso si ya tienen API key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza todas las empresas de Laravel con la base de datos de WhatsApp (larawhatsapp)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Iniciando sincronización de empresas con WhatsApp API...');
        $this->newLine();

        // Obtener empresas a sincronizar
        $query = DB::table('empresas');
        
        if (!$this->option('force')) {
            $query->where(function ($q) {
                $q->whereNull('whatsapp_api_key')
                  ->orWhere('whatsapp_api_key', '');
            });
        }

        $empresas = $query->get();

        if ($empresas->isEmpty()) {
            $this->info('✅ No hay empresas para sincronizar.');
            return 0;
        }

        $this->info("📋 Empresas a sincronizar: {$empresas->count()}");
        $this->newLine();

        $bar = $this->output->createProgressBar($empresas->count());
        $bar->start();

        $success = 0;
        $failed = 0;

        foreach ($empresas as $empresa) {
            $result = $this->syncEmpresa($empresa);
            
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
    private function syncEmpresa($empresa): bool
    {
        try {
            // Generar API key si no existe
            $apiKey = $empresa->whatsapp_api_key;
            if (empty($apiKey)) {
                $apiKey = 'wa_' . $empresa->id . '_' . bin2hex(random_bytes(8));
                
                // Actualizar la empresa con la nueva API key
                DB::table('empresas')
                    ->where('id', $empresa->id)
                    ->update(['whatsapp_api_key' => $apiKey]);
            }

            // Sincronizar con tabla companies en larawhatsapp
            $webhookUrl = config('whatsapp.api_url') . '/api/whatsapp/webhook';
            
            DB::connection('whatsapp_api')->table('companies')->updateOrInsert(
                ['id' => $empresa->id],
                [
                    'name' => $empresa->razon_social ?? $empresa->nombre ?? 'Empresa',
                    'apiKey' => $apiKey,
                    'webhookUrl' => $webhookUrl,
                    'rateLimitPerMinute' => $empresa->whatsapp_rate_limit ?? 60,
                    'isActive' => 1,
                    'createdAt' => now(),
                    'updatedAt' => now()
                ]
            );

            return true;

        } catch (\Exception $e) {
            Log::error('Error sincronizando empresa con WhatsApp API', [
                'empresa_id' => $empresa->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
}