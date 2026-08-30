<?php

namespace App\Console\Commands;

use App\Services\WhatsAppService;
use Illuminate\Console\Command;

class CheckWhatsAppHealthCommand extends Command
{
    protected $signature = 'whatsapp:health {instance? : Nombre de la instancia} {--company= : ID de la empresa}';
    protected $description = 'Verifica el ratio de salud, estado del calentamiento y disyuntor (Circuit Breaker) de WhatsApp';

    public function handle(): int
    {
        $companyId = $this->option('company') ? (int) $this->option('company') : 1;
        $whatsapp = WhatsAppService::forCompany($companyId);
        $instance = $this->argument('instance') ?? $whatsapp->getInstanceName();

        $this->info("🔍 Consultando estado de salud para instancia [{$instance}] (Empresa ID: {$companyId})...");

        $stats = $whatsapp->getQueueStats($instance);

        if (! $stats) {
            $this->error("❌ No se pudo obtener información de la instancia [{$instance}]. Verifica que el motor API esté corriendo.");
            return 1;
        }

        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Instancia', $instance],
                ['Mensajes en Cola', $stats['queued'] ?? 0],
                ['Enviados Hoy / Límite', ($stats['sentToday'] ?? 0) . ' / ' . ($stats['dailyLimit'] ?? 100) . ' msgs'],
                ['Calentamiento Progresivo', !empty($stats['warmupMode']) ? "🔥 Activo (Día {$stats['warmupDay']}, Tope {$stats['warmupTargetLimit']} msgs/día)" : '⚪ Inactivo'],
                ['Histórico Enviados / Recibidos', ($stats['totalSentCount'] ?? 0) . ' / ' . ($stats['totalReceivedCount'] ?? 0)],
                ['Ratio de Salud (In/Out)', round(($stats['inboundOutboundRatio'] ?? 1.0) * 100) . '% ' . (($stats['inboundOutboundRatio'] ?? 1.0) < 0.15 ? '⚠️ ZONA DE RIESGO' : '🟢 SEGURO')],
                ['Disyuntor (Circuit Breaker)', !empty($stats['circuitBreakerActive']) ? "🚨 ACTIVADO (Pausado hasta {$stats['circuitBreakerUntil']})" : '🟢 Normal'],
                ['Mutación Hash Multimedia', !empty($stats['mutateMediaHash']) ? '🎨 Activada' : '⚪ Desactivada'],
                ['Proxy Principal', $stats['proxyUrl'] ? $stats['proxyUrl'] : 'Ninguno'],
                ['Proxy Contingencia', $stats['backupProxyUrl'] ? $stats['backupProxyUrl'] : 'Ninguno'],
            ]
        );

        if (!empty($stats['circuitBreakerActive'])) {
            if ($this->confirm('¿Deseas resetear el Circuit Breaker y reanudar envíos ahora?')) {
                $reset = $whatsapp->resetCircuitBreaker($instance);
                $this->info($reset['message'] ?? 'Circuit breaker reseteado con éxito.');
            }
        }

        return 0;
    }
}
