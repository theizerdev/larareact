<?php

namespace App\Console\Commands;

use App\Models\WhatsAppMessage;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class WhatsAppRetryStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:retry-status 
                            {--days=7 : Número de días hacia atrás para el análisis}
                            {--detailed : Mostrar información detallada}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ver el estado del sistema de reenvío de mensajes de WhatsApp fallidos';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = $this->option('days');
        $detailed = $this->option('detailed');
        
        $this->info('Estado del Sistema de Reenvío WhatsApp');
        $this->info('==========================================');
        $this->newLine();

        // Estadísticas generales
        $this->showGeneralStats($days);
        
        if ($detailed) {
            $this->showDetailedStats($days);
        }
        
        $this->showRecommendations();
        
        return Command::SUCCESS;
    }

    private function showGeneralStats(int $days)
    {
        $cutoffDate = Carbon::now()->subDays($days);
        
        // Mensajes reenviables
        $retryable = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->retryable()
            ->count();

        // Mensajes con máximos reintentos excedidos
        $maxRetriesExceeded = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->maxRetriesExceeded()
            ->count();

        // Mensajes reenviados exitosamente
        $successfulRetries = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->where('status', 'sent')
            ->where('retry_count', '>', 0)
            ->count();

        // Mensajes fallidos en reintentos
        $failedRetries = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->where('status', 'failed')
            ->where('retry_count', '>', 0)
            ->count();

        // Tasa de éxito de reenvíos
        $totalRetries = $successfulRetries + $failedRetries;
        $successRate = $totalRetries > 0 ? round(($successfulRetries / $totalRetries) * 100, 2) : 0;

        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Período de análisis', "{$days} días"],
                ['Mensajes reenviables', format_money($retryable)],
                ['Máx. reintentos excedidos', format_money($maxRetriesExceeded)],
                ['Reenvíos exitosos', format_money($successfulRetries)],
                ['Reenvíos fallidos', format_money($failedRetries)],
                ['Tasa de éxito de reenvíos', "{$successRate}%"],
            ]
        );
        
        $this->newLine();
    }

    private function showDetailedStats(int $days)
    {
        $cutoffDate = Carbon::now()->subDays($days);
        
        $this->info('Distribución por Estado:');
        
        // Distribución por estado de mensajes con reintentos
        $statusDistribution = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->where('retry_count', '>', 0)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        if (!empty($statusDistribution)) {
            $statusData = [];
            foreach ($statusDistribution as $status => $count) {
                $statusData[] = [ucfirst($status), format_money($count)];
            }
            $this->table(['Estado', 'Cantidad'], $statusData);
        } else {
            $this->info('No hay mensajes con reintentos en el período.');
        }
        
        $this->newLine();
        
        $this->info('Distribución por Número de Reintentos:');
        
        // Distribución por número de reintentos
        $retryDistribution = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->where('retry_count', '>', 0)
            ->select('retry_count', DB::raw('count(*) as count'))
            ->groupBy('retry_count')
            ->orderBy('retry_count')
            ->pluck('count', 'retry_count')
            ->toArray();

        if (!empty($retryDistribution)) {
            $retryData = [];
            foreach ($retryDistribution as $retries => $count) {
                $retryData[] = ["{$retries} reintentos", format_money($count)];
            }
            $this->table(['Reintentos', 'Cantidad'], $retryData);
        } else {
            $this->info('No hay mensajes con reintentos en el período.');
        }
        
        $this->newLine();
        
        // Top 10 contactos con más reintentos
        $this->info('Top 10 Contactos con Más Reintentos:');
        
        $topContacts = WhatsAppMessage::where('direction', 'outbound')
            ->where('created_at', '>=', $cutoffDate)
            ->where('retry_count', '>', 0)
            ->select('recipient_phone', 'recipient_name', DB::raw('count(*) as total_messages'), DB::raw('sum(retry_count) as total_retries'))
            ->groupBy('recipient_phone', 'recipient_name')
            ->orderBy('total_retries', 'desc')
            ->limit(10)
            ->get();

        if ($topContacts->isNotEmpty()) {
            $contactData = [];
            foreach ($topContacts as $contact) {
                $name = $contact->recipient_name ?: $contact->recipient_phone;
                $contactData[] = [
                    substr($name, 0, 20) . (strlen($name) > 20 ? '...' : ''),
                    format_money($contact->total_messages),
                    format_money($contact->total_retries)
                ];
            }
            $this->table(['Contacto', 'Mensajes', 'Reintentos'], $contactData);
        } else {
            $this->info('No hay contactos con reintentos en el período.');
        }
        
        $this->newLine();
    }

    private function showRecommendations()
    {
        $this->info('Recomendaciones:');
        $this->info('================');
        
        // Obtener estadísticas para recomendaciones
        $retryable = WhatsAppMessage::where('direction', 'outbound')
            ->retryable()
            ->count();
            
        $maxRetriesExceeded = WhatsAppMessage::where('direction', 'outbound')
            ->maxRetriesExceeded()
            ->count();

        $recommendations = [];

        if ($retryable > 0) {
            $recommendations[] = "• Hay {$retryable} mensajes reenviables. Considera ejecutar el reenvío manual o automático.";
        }

        if ($maxRetriesExceeded > 10) {
            $recommendations[] = "• {$maxRetriesExceeded} mensajes han excedido el máximo de reintentos. Revisa estos casos manualmente.";
        }

        if (empty($recommendations)) {
            $recommendations[] = "• El sistema de reenvío está funcionando correctamente. No hay acciones pendientes.";
        }

        $recommendations[] = "• Usa 'php artisan whatsapp:schedule-retry' para reenviar mensajes fallidos.";
        $recommendations[] = "• Usa 'php artisan whatsapp:setup-auto-retry' para configurar reenvío automático.";

        foreach ($recommendations as $recommendation) {
            $this->line($recommendation);
        }
    }
}