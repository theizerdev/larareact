<?php

namespace App\Console\Commands;

use App\Models\CitaRecordatorio;
use App\Services\CitaNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcesarRecordatoriosCitas extends Command
{
    protected $signature = 'citas:procesar-recordatorios';
    protected $description = 'Procesar y enviar recordatorios de citas pendientes';

    public function handle()
    {
        $this->info('🚀 Iniciando procesamiento de recordatorios...');

        $recordatorios = CitaRecordatorio::pendientes()
            ->with(['cita.paciente', 'cita.medico', 'cita.especialidad', 'cita.sucursal'])
            ->get();

        $this->info("📋 Se encontraron {$recordatorios->count()} recordatorios pendientes");

        $enviados = 0;
        $fallidos = 0;

        foreach ($recordatorios as $recordatorio) {
            try {
                $this->info("📤 Procesando recordatorio #{$recordatorio->id} para cita #{$recordatorio->cita_id}");

                $service = CitaNotificationService::forCompany($recordatorio->cita->empresa_id);
                
                // Enviar recordatorio según el canal
                switch ($recordatorio->canal) {
                    case 'whatsapp':
                        $enviado = $this->enviarWhatsApp($recordatorio, $service);
                        break;
                    case 'email':
                        $enviado = $this->enviarEmail($recordatorio);
                        break;
                    case 'sms':
                        $enviado = $this->enviarSMS($recordatorio);
                        break;
                    default:
                        $enviado = false;
                }

                if ($enviado) {
                    $recordatorio->marcarComoEnviado();
                    $enviados++;
                    $this->info("✅ Recordatorio enviado exitosamente");
                } else {
                    $recordatorio->marcarComoFallido('Error al enviar por ' . $recordatorio->canal);
                    $fallidos++;
                    $this->error("❌ Error al enviar recordatorio");
                }

            } catch (\Exception $e) {
                Log::error('Error procesando recordatorio', [
                    'recordatorio_id' => $recordatorio->id,
                    'error' => $e->getMessage()
                ]);
                
                $recordatorio->marcarComoFallido($e->getMessage());
                $fallidos++;
                $this->error("❌ Error procesando recordatorio: {$e->getMessage()}");
            }
        }

        $this->info("📊 Resumen:");
        $this->info("   ✅ Enviados: {$enviados}");
        $this->info("   ❌ Fallidos: {$fallidos}");
        $this->info("🎉 Procesamiento completado!");

        return Command::SUCCESS;
    }

    private function enviarWhatsApp(CitaRecordatorio $recordatorio, CitaNotificationService $service): bool
    {
        try {
            // Verificar que el paciente tenga WhatsApp
            $paciente = $recordatorio->cita->paciente;
            if (!$paciente->telefono) {
                throw new \Exception('Paciente sin número de teléfono');
            }

            // Enviar el mensaje personalizado
            $mensaje = $recordatorio->mensaje ?: $recordatorio->cita->generarMensajeRecordatorio($recordatorio->tipo);
            
            return $service->enviarRecordatorio($recordatorio->cita, $mensaje);
            
        } catch (\Exception $e) {
            Log::error('Error enviando WhatsApp', [
                'recordatorio_id' => $recordatorio->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    private function enviarEmail(CitaRecordatorio $recordatorio): bool
    {
        // Implementar envío de email
        // Por ahora retornamos false para indicar que no está implementado
        return false;
    }

    private function enviarSMS(CitaRecordatorio $recordatorio): bool
    {
        // Implementar envío de SMS
        // Por ahora retornamos false para indicar que no está implementado
        return false;
    }
}