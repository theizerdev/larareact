<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateWhatsAppInstanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:create-instance 
                            {empresa_id? : ID de la empresa específica (opcional, si se omite procesa todas las empresas activas)}
                            {--force : Forzar regeneración de URL y API Key}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crea, sincroniza e inicializa las instancias de WhatsApp en el microservicio para empresas específicas o todas las activas';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $empresaId = $this->argument('empresa_id');
        $force = (bool) $this->option('force');

        $query = Empresa::on('landlord');
        if ($empresaId) {
            $empresas = $query->where('id', $empresaId)->get();
            if ($empresas->isEmpty()) {
                $this->error("❌ No se encontró ninguna empresa con ID {$empresaId}.");
                return Command::FAILURE;
            }
        } else {
            $empresas = $query->where('status', true)->get();
        }

        $this->info("🚀 Sincronizando e inicializando instancias de WhatsApp en el motor (" . $empresas->count() . " empresas)...");
        $this->newLine();

        $rows = [];
        $localApiUrl = config('whatsapp.api_url', 'http://127.0.0.1:3000');

        foreach ($empresas as $empresa) {
            $updateData = [];

            // 1. Asegurar URL local del microservicio
            if (empty($empresa->whatsapp_api_url) || str_contains($empresa->whatsapp_api_url, '169.58.168.213') || $force) {
                $updateData['whatsapp_api_url'] = $localApiUrl;
                $empresa->whatsapp_api_url = $localApiUrl;
            }

            // 2. Asegurar API Key única
            if (empty($empresa->whatsapp_api_key) || $force) {
                $token = Str::random(32);
                $updateData['whatsapp_api_key'] = $token;
                $empresa->whatsapp_api_key = $token;
            }

            if (!empty($updateData)) {
                $empresa->update($updateData);
            }

            // 3. Iterar sobre las sucursales de la empresa
            $sucursales = $empresa->sucursales;
            if ($sucursales->isEmpty()) {
                $sucursales = collect([
                    \App\Models\Sucursal::create([
                        'empresa_id' => $empresa->id,
                        'nombre' => 'Principal',
                        'status' => true,
                    ])
                ]);
            }

            foreach ($sucursales as $sucursal) {
                $instanceName = $sucursal->whatsapp_instance;
                if (empty($instanceName) || $force) {
                    $instanceName = 'sucursal_'.$sucursal->id;
                    $instanceName = $sucursal->getWhatsAppInstanceName();
                    $sucursal->update(['whatsapp_instance' => $instanceName]);
                }

                $statusLabel = 'Error';
                $details = '';

                try {
                    $service = WhatsAppService::forBranch($sucursal)->setTimeout(10);
                    $createResult = $service->createInstance($instanceName, $empresa->whatsapp_api_key);

                    $liveStatus = $service->getStatus($instanceName);
                    $statusStr = $liveStatus['status'] ?? 'unknown';
                    $isConnected = (bool) ($liveStatus['isConnected'] ?? false);

                    if ($isConnected) {
                        $statusLabel = '🟢 Conectado (open)';
                    } elseif ($statusStr === 'qr' || ($liveStatus['qrDataUrl'] ?? null)) {
                        $statusLabel = '🟡 QR Listo (qr)';
                    } elseif ($statusStr === 'connecting') {
                        $statusLabel = '🔵 Conectando (connecting)';
                    } elseif ($statusStr === 'close') {
                        $statusLabel = '⚪ Desconectado (close)';
                    } else {
                        $statusLabel = "🟣 {$statusStr}";
                    }

                    $details = $createResult['message'] ?? 'Instancia activa en motor';
                } catch (\Throwable $e) {
                    $statusLabel = '🔴 Excepción';
                    $details = $e->getMessage();
                }

                $rows[] = [
                    $empresa->id,
                    Str::limit($empresa->razon_social, 18),
                    $sucursal->id . ' - ' . Str::limit($sucursal->nombre, 18),
                    $instanceName,
                    $statusLabel,
                    Str::limit($details, 30),
                ];
            }
        }

        $this->table(
            ['Empresa ID', 'Empresa', 'Sucursal', 'Instancia WhatsApp', 'Estado Motor', 'Detalle'],
            $rows
        );

        $this->newLine();
        $this->info("✅ Proceso completado exitosamente.");
        return Command::SUCCESS;
    }
}

