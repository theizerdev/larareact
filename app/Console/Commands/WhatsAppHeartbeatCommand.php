<?php

namespace App\Console\Commands;

use App\Models\Sucursal;
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
    protected $signature = 'whatsapp:heartbeat {--sucursal= : ID específico de sucursal a verificar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitoriza la salud, latencia y conexión de las instancias de WhatsApp por Sucursal';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🩺 Iniciando monitor de salud (Heartbeat) de WhatsApp por Sucursal...');

        $sucursalId = $this->option('sucursal');
        $query = Sucursal::query()->where('whatsapp_active', true)->with('empresa');

        if ($sucursalId) {
            $query->where('id', $sucursalId);
        }

        $sucursales = $query->get();

        if ($sucursales->isEmpty()) {
            $this->warn('No hay sucursales activas con integración de WhatsApp.');
            return self::SUCCESS;
        }

        foreach ($sucursales as $sucursal) {
            $this->line("Comprobando sucursal: {$sucursal->nombre} (ID: {$sucursal->id}, Instancia: {$sucursal->whatsapp_instance})");

            $startTime = microtime(true);
            $service = WhatsAppService::forSucursal($sucursal);
            $status = $service->getStatus();
            $latencyMs = round((microtime(true) - $startTime) * 1000, 2);

            $isConnected = ! empty($status['isConnected']);
            $connectionState = $status['connectionState'] ?? $status['status'] ?? 'unknown';
            $previousStatus = $sucursal->whatsapp_status;

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

            $sucursal->update($updateData);

            if ($isConnected) {
                $this->info("  ✅ CONECTADO [{$connectionState}] - Teléfono: {$sucursal->whatsapp_phone} - Latencia: {$latencyMs}ms");
            } else {
                $this->warn("  ⚠️ NO CONECTADO [{$connectionState}] - Latencia: {$latencyMs}ms");

                if ($previousStatus === 'connected') {
                    Log::alert("🚨 ALERTA: La instancia de WhatsApp '{$sucursal->whatsapp_instance}' de la sucursal '{$sucursal->nombre}' se ha DESCONECTADO.", [
                        'sucursal_id' => $sucursal->id,
                        'empresa_id' => $sucursal->empresa_id,
                        'instance' => $sucursal->whatsapp_instance,
                        'status' => $status,
                    ]);
                }
            }
        }

        $this->info('🏁 Heartbeat completado.');
        return self::SUCCESS;
    }
}
