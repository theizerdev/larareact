<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Models\Empresa;
use App\Services\WhatsAppService;

class TestWhatsAppConnection extends Command
{
    protected $signature = 'whatsapp:test-connection';
    protected $description = 'Prueba e interactúa con la conexión de la API de WhatsApp y la base de datos';

    public function handle()
    {
        $this->info('====================================================');
        $this->info('   HERRAMIENTA DE DIAGNÓSTICO DE CONEXIÓN WHATSAPP');
        $this->info('====================================================');

        // 1. Diagnóstico de Base de Datos
        $this->info("\n--- 1. PROBANDO CONEXIÓN A BASE DE DATOS EXTERNA (whatsapp_api) ---");
        $dbConfig = config('database.connections.whatsapp_api');
        
        if (!$dbConfig) {
            $this->error('❌ La conexión "whatsapp_api" no está definida en config/database.php');
        } else {
            $this->line("Host: " . ($dbConfig['host'] ?? 'No definido'));
            $this->line("Database: " . ($dbConfig['database'] ?? 'No definida'));
            $this->line("Username: " . ($dbConfig['username'] ?? 'No definido'));

            try {
                $this->warn('🔄 Intentando conectar a la base de datos (Timeout: 5s)...');
                DB::purge('whatsapp_api');
                $pdo = DB::connection('whatsapp_api')->getPdo();
                $this->info('✅ ¡Conexión a base de datos exitosa!');
                
                $companiesCount = DB::connection('whatsapp_api')->table('companies')->count();
                $this->info("📊 Empresas registradas en la API externa: {$companiesCount}");
            } catch (\Exception $e) {
                $this->error('❌ Error al conectar a la base de datos:');
                $this->line($e->getMessage());
            }
        }

        // 2. Diagnóstico de API de WhatsApp (HTTP)
        $this->info("\n--- 2. PROBANDO CONEXIÓN HTTP A LA API ---");
        
        $empresa = null;
        $empresaId = $this->ask('¿Qué ID de empresa deseas usar para la prueba?', 1);
        $empresa = Empresa::find($empresaId);

        if (!$empresa) {
            $this->error("❌ Empresa con ID {$empresaId} no encontrada en la base de datos local.");
            $apiUrl = config('whatsapp.api_url');
            $apiKey = config('whatsapp.api_key');
        } else {
            $this->info("🏢 Empresa seleccionada: {$empresa->razon_social}");
            $apiUrl = $empresa->whatsapp_api_url ?? config('whatsapp.api_url');
            $apiKey = $empresa->whatsapp_api_key ?? config('whatsapp.api_key');
        }

        $this->line("🌐 API URL: {$apiUrl}");
        $this->line("🔑 API Key: " . substr($apiKey, 0, 15) . '...');

        if ($this->confirm('¿Deseas probar con una URL de la API de WhatsApp diferente?', false)) {
            $apiUrl = $this->ask('Introduce la URL completa (ej. http://127.0.0.1:8092)', $apiUrl);
        }

        // Probar endpoint de salud / status
        try {
            $this->warn('🔄 Realizando petición de salud (Health Check)...');
            $healthUrl = rtrim($apiUrl, '/') . '/health';
            $response = Http::timeout(5)->get($healthUrl);
            
            $this->line("Status HTTP: {$response->status()}");
            if ($response->successful()) {
                $this->info("✅ API está levantada (Health check exitoso)");
                $this->line("Respuesta: " . json_encode($response->json()));
            } else {
                $this->warn("⚠️ API respondió pero devolvió un código de error.");
            }
        } catch (\Exception $e) {
            $this->error("❌ No se pudo conectar con el endpoint de salud de la API:");
            $this->line($e->getMessage());
        }

        try {
            $this->warn("\n🔄 Comprobando el estado de la sesión de WhatsApp...");
            $statusUrl = rtrim($apiUrl, '/') . '/api/whatsapp/status';
            $response = Http::withHeaders([
                'X-API-Key' => $apiKey,
                'X-Company-Id' => (string)($empresa ? $empresa->id : 1),
            ])->timeout(5)->get($statusUrl);

            $this->line("Status HTTP: {$response->status()}");
            if ($response->successful()) {
                $this->info("✅ ¡Sesión de la API obtenida correctamente!");
                $data = $response->json();
                $this->line("Respuesta: " . json_encode($data));
                
                $isConnected = $data['isConnected'] ?? false;
                if ($isConnected) {
                    $this->info("🟢 WhatsApp está CONECTADO y listo para enviar mensajes.");
                } else {
                    $this->warn("🔴 WhatsApp está DESCONECTADO (falta escanear QR).");
                }
            } else {
                $this->error("❌ La API rechazó la autenticación o falló:");
                $this->line("Código: " . $response->status());
                $this->line("Respuesta: " . $response->body());
            }
        } catch (\Exception $e) {
            $this->error("❌ Error al obtener el estado de la sesión:");
            $this->line($e->getMessage());
        }

        // 3. Prueba de envío de mensaje de texto
        if ($this->confirm("\n¿Deseas intentar enviar un mensaje de prueba de WhatsApp?", false)) {
            $to = $this->ask('Introduce el número de teléfono con código de país (ej. 584120000000)');
            
            if ($to) {
                try {
                    $this->warn('🔄 Enviando mensaje de prueba...');
                    
                    if ($empresa) {
                        $service = new WhatsAppService($empresa);
                    } else {
                        $service = WhatsAppService::forCredentials([
                            'api_url' => $apiUrl,
                            'api_key' => $apiKey,
                            'company_id' => 1
                        ]);
                    }
                    
                    // Inyectar URL si la cambió manualmente
                    $ref = new \ReflectionClass($service);
                    $prop = $ref->getProperty('baseUrl');
                    $prop->setAccessible(true);
                    $prop->setValue($service, $apiUrl);

                    $result = $service->sendMessage($to, 'Prueba de conexión exitosa desde el comando de diagnóstico Artisan.');
                    
                    if ($result) {
                        $this->info("✅ ¡Mensaje enviado con éxito!");
                        $this->line("Respuesta del servidor: " . json_encode($result));
                    } else {
                        $this->error("❌ El servicio de WhatsApp no pudo procesar el envío. Revisa los logs.");
                    }
                } catch (\Exception $e) {
                    $this->error("❌ Excepción al enviar mensaje:");
                    $this->line($e->getMessage());
                }
            }
        }

        $this->info("\n====================================================");
        $this->info('   FIN DE LA PRUEBA');
        $this->info("====================================================\n");
    }
}
