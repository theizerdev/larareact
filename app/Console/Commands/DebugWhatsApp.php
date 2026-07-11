<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class DebugWhatsApp extends Command
{
    protected $signature = 'whatsapp:debug';
    protected $description = 'Debug WhatsApp connection issues';

    public function handle()
    {
        $this->info('=== Debug WhatsApp Connection ===');
        
        // 1. Verificar configuración
        $apiUrl = config('whatsapp.api_url');
        $jwtSecret = config('whatsapp.jwt_secret');
        
        $this->info('1. Configuración:');
        $this->line('   API URL: ' . $apiUrl);
        $this->line('   JWT Secret: ' . substr($jwtSecret, 0, 20) . '...');
        
        // 2. Verificar token JWT
        $empresa = DB::table('empresas')->where('id', 1)->first();
        $this->info('2. Empresa API Key:');
        $this->line('   Empresa encontrada: ' . ($empresa ? 'Sí' : 'No'));
        if ($empresa) {
            $this->line('   API Key: ' . substr($empresa->api_key, 0, 20) . '...');
        }
        
        // 3. Probar conexión directa
        $token = $empresa ? $empresa->api_key : $jwtSecret;
        $this->info('3. Prueba de conexión:');
        
        try {
            // Test 1: Health check
            $this->info('   Test 1 - Health Check:');
            $healthResponse = Http::timeout(5)->get($apiUrl . '/health');
            $this->line('   Status: ' . $healthResponse->status());
            $this->line('   Success: ' . ($healthResponse->successful() ? 'Sí' : 'No'));
            
            if ($healthResponse->successful()) {
                $this->line('   Response: ' . json_encode($healthResponse->json()));
            }
            
            $this->info('   Test 2 - Status con token:');
            $statusResponse = Http::withHeaders([
                'X-API-Key' => $token
            ])->timeout(10)->get($apiUrl . '/api/whatsapp/status');
            
            $this->line('   Status: ' . $statusResponse->status());
            $this->line('   Success: ' . ($statusResponse->successful() ? 'Sí' : 'No'));
            
            if ($statusResponse->successful()) {
                $this->line('   Response: ' . json_encode($statusResponse->json()));
            } else {
                $this->error('   Error: ' . $statusResponse->body());
            }
            
        } catch (\Exception $e) {
            $this->error('   Error: ' . $e->getMessage());
        }
        
        $this->info('=== Fin del debug ===');
    }
}