<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\WhatsAppMessage;
use App\Models\WhatsAppScheduledMessage;
use App\Services\WhatsAppService;
use Carbon\Carbon;

class RetryFailedWhatsAppMessages extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:retry-failed 
                            {--days=7 : Número de días hacia atrás para buscar mensajes fallidos}
                            {--max-retries=3 : Máximo de reintentos por mensaje}
                            {--dry-run : Solo mostrar mensajes que serían reenviados sin ejecutar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reenviar mensajes de WhatsApp fallidos o simulados cuando el servicio esté disponible';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $maxRetries = $this->option('max-retries');
        $dryRun = $this->option('dry-run');

        $this->info("Buscando mensajes fallidos o simulados de los últimos {$days} días...");

        // Obtener mensajes que pueden ser reenviados
        $failedMessages = $this->getRetryableMessages($days, $maxRetries);
        
        if ($failedMessages->isEmpty()) {
            $this->info('No se encontraron mensajes para reenviar.');
            return;
        }

        $this->info("Se encontraron {$failedMessages->count()} mensajes para reenviar.");

        if ($dryRun) {
            $this->table(
                ['ID', 'Destinatario', 'Estado', 'Error', 'Fecha'],
                $failedMessages->map(function ($message) {
                    return [
                        $message->id,
                        $message->recipient_phone . ' (' . $message->recipient_name . ')',
                        $message->status,
                        $message->error_message ?: 'Simulado',
                        $message->sent_at->format('Y-m-d H:i:s')
                    ];
                })
            );
            return;
        }

        // Verificar si el servicio de WhatsApp está disponible
        $whatsAppService = app(WhatsAppService::class);
        $connectionTest = $whatsAppService->testConnection();

        if (!$connectionTest['success']) {
            $this->error('El servicio de WhatsApp no está disponible: ' . $connectionTest['message']);
            return 1;
        }

        $this->info('Servicio de WhatsApp disponible. Procediendo con reenvíos...');

        $successCount = 0;
        $failedCount = 0;

        foreach ($failedMessages as $message) {
            try {
                $this->info("Reenviando mensaje #{$message->id} a {$message->recipient_phone}...");
                
                $result = $this->retryMessage($message, $whatsAppService);
                
                if ($result['success']) {
                    $successCount++;
                    $this->info("✓ Mensaje reenviado exitosamente");
                } else {
                    $failedCount++;
                    $this->error("✗ Error al reenviar: " . $result['message']);
                }
            } catch (\Exception $e) {
                $failedCount++;
                $this->error("✗ Excepción al reenviar: " . $e->getMessage());
            }

            // Pequeña pausa entre mensajes para evitar sobrecarga
            usleep(500000); // 0.5 segundos
        }

        $this->info("\nResumen del reenvío:");
        $this->info("✓ Exitosos: {$successCount}");
        $this->info("✗ Fallidos: {$failedCount}");
        $this->info("Total: " . ($successCount + $failedCount));

        return 0;
    }

    /**
     * Obtener mensajes que pueden ser reenviados
     */
    private function getRetryableMessages(int $days, int $maxRetries)
    {
        $cutoffDate = Carbon::now()->subDays($days);

        return WhatsAppMessage::where('created_at', '>=', $cutoffDate)
            ->where('direction', 'outbound')
            ->where(function ($query) use ($maxRetries) {
                // Mensajes fallidos o con errores
                $query->where('status', 'failed')
                      ->orWhereNotNull('error_message');
                      
                // Mensajes simulados (éxito pero sin message_id real)
                $query->orWhere(function ($q) {
                    $q->where('status', 'sent')
                      ->whereNull('message_id')
                      ->orWhere('message_id', 'like', 'msg_%'); // IDs generados internamente
                });
            })
            ->where(function ($query) use ($maxRetries) {
                // No exceder el máximo de reintentos (usando el nuevo campo retry_count)
                $query->where('retry_count', '<', $maxRetries);
            })
            ->orderBy('created_at', 'asc')
            ->get();
    }

    /**
     * Reintentar el envío de un mensaje
     */
    private function retryMessage(WhatsAppMessage $message, WhatsAppService $service): array
    {
        try {
            // Preparar el mensaje para reenvío
            $template = $message->template;
            $content = $message->message_content;
            $variables = $message->variables ?? [];

            // Si tiene plantilla, usar el contenido procesado
            if ($template) {
                $content = $template->getProcessedContent($variables);
            }

            // Intentar reenviar el mensaje
            $result = $service->sendMessage([
                'phone' => $message->recipient_phone,
                'message' => $content,
                'template' => $template ? $template->name : null,
                'parameters' => $variables
            ]);

            if ($result['success']) {
                // Actualizar el mensaje original con el nuevo estado
                $message->update([
                    'status' => 'sent',
                    'message_id' => $result['message_id'] ?? $message->message_id,
                    'error_message' => null,
                    'sent_at' => now(),
                    'metadata' => array_merge($message->metadata ?? [], [
                        'retried_at' => now()->toDateTimeString(),
                        'retry_count' => ($message->metadata['retry_count'] ?? 0) + 1,
                        'original_status' => $message->status,
                        'original_error' => $message->error_message
                    ])
                ]);

                // Crear un nuevo registro para el historial de reenvíos
                WhatsAppMessage::create([
                    'message_id' => $result['message_id'],
                    'template_id' => $message->template_id,
                    'recipient_phone' => $message->recipient_phone,
                    'recipient_name' => $message->recipient_name,
                    'message_content' => $content,
                    'variables' => $variables,
                    'status' => 'sent',
                    'direction' => 'outbound',
                    'sent_at' => now(),
                    'created_by' => $message->created_by,
                    'metadata' => [
                        'is_retry' => true,
                        'original_message_id' => $message->id,
                        'retry_successful' => true
                    ]
                ]);

                return ['success' => true, 'message' => 'Mensaje reenviado exitosamente'];
            } else {
                // Incrementar contador de reintentos
                $message->update([
                    'metadata' => array_merge($message->metadata ?? [], [
                        'retried_at' => now()->toDateTimeString(),
                        'retry_count' => ($message->metadata['retry_count'] ?? 0) + 1,
                        'last_retry_error' => $result['message'] ?? 'Error desconocido'
                    ])
                ]);

                return ['success' => false, 'message' => $result['message'] ?? 'Error al reenviar'];
            }
        } catch (\Exception $e) {
            // Manejar excepciones
            $message->update([
                'metadata' => array_merge($message->metadata ?? [], [
                    'retried_at' => now()->toDateTimeString(),
                    'retry_count' => ($message->metadata['retry_count'] ?? 0) + 1,
                    'last_retry_exception' => $e->getMessage()
                ])
            ]);

            return ['success' => false, 'message' => 'Excepción: ' . $e->getMessage()];
        }
    }
}