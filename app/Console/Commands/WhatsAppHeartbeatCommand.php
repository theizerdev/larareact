<?php

namespace App\Console\Commands;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class WhatsAppHeartbeatCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:heartbeat {--empresa= : ID específico de empresa a verificar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitoriza la salud, latencia y conexión de las instancias de WhatsApp';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🩺 Iniciando monitor de salud (Heartbeat) de WhatsApp...');

        $empresaId = $this->option('empresa');
        $query = Empresa::query()->where('whatsapp_active', true);

        if ($empresaId) {
            $query->where('id', $empresaId);
        }

        $empresas = $query->get();

        if ($empresas->isEmpty()) {
            $this->warn('No hay empresas activas con integración de WhatsApp.');
            return self::SUCCESS;
        }

        foreach ($empresas as $empresa) {
            $this->line("Comprobando empresa: {$empresa->razon_social} (ID: {$empresa->id}, Instancia: {$empresa->whatsapp_instance})");

            $startTime = microtime(true);
            $service = new WhatsAppService($empresa);
            $status = $service->getStatus();
            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

            $isConnected = ! empty($status['isConnected']);
            $connectionState = $status['connectionState'] ?? $status['status'] ?? 'unknown';
            $previousStatus = $empresa->whatsapp_status;

            // Extraer teléfono si está conectado
            $phone = null;
            if (! empty($status['userJid'])) {
                $phone = explode('@', $status['userJid'])[0];
            } elseif (! empty($status['user']['id'])) {
                $phone = explode('@', $status['user']['id'])[0];
            }

            $updateData = [
                'whatsapp_status' => $isConnected ? 'connected' : ($connectionState === 'qr_ready' || $connectionState === 'qr' ? 'qr_ready' : 'disconnected'),
            ];

            if ($phone) {
                $updateData['whatsapp_phone'] = $phone;
            }

            if ($isConnected) {
                $updateData['whatsapp_last_connected'] = now();
            }

            $empresa->update($updateData);

            if ($isConnected) {
                $this->info("  ✅ CONECTADO [{$connectionState}] - Teléfono: {$empresa->whatsapp_phone} - Latencia: {$latencyMs}ms");
            } else {
                $this->warn("  ⚠️ NO CONECTADO [{$connectionState}] - Latencia: {$latencyMs}ms");

                if ($previousStatus === 'connected') {
                    Log::alert("🚨 ALERTA: La instancia de WhatsApp '{$empresa->whatsapp_instance}' de la empresa '{$empresa->razon_social}' se ha DESCONECTADO.", [
                        'empresa_id' => $empresa->id,
                        'instance' => $empresa->whatsapp_instance,
                        'status' => $status,
                    ]);
                }
            }
        }

        $this->info('🏁 Heartbeat completado.');
        return self::SUCCESS;
    }
}
