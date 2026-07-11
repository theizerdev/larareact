<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WhatsAppService;

class TestWhatsAppMessage extends Command
{
    protected $signature = 'whatsapp:test-message {phone} {message?} {--company=1}';
    protected $description = 'Prueba el envío de mensajes de WhatsApp';

    public function handle()
    {
        $phone = $this->argument('phone');
        $message = $this->argument('message') ?? 'Mensaje de prueba desde consola';
        $companyId = $this->option('company');
        
        $this->info("Probando envío de WhatsApp...");
        $this->line("Teléfono: {$phone}");
        $this->line("Mensaje: {$message}");
        $this->line("Empresa: {$companyId}");
        
        try {
            $whatsappService = new WhatsAppService($companyId);
            $result = $whatsappService->sendMessage($phone, $message);
            
            if ($result && isset($result['success']) && $result['success']) {
                $this->info("✅ Mensaje enviado exitosamente");
                $this->line("ID del mensaje: " . ($result['messageId'] ?? 'N/A'));
            } else {
                $errorMessage = 'Error desconocido';
                if (is_array($result) && isset($result['error'])) {
                    $errorMessage = $result['error'];
                } elseif ($result === null) {
                    $errorMessage = 'El servicio devolvió null - revise los logs';
                }
                $this->error("❌ Error al enviar mensaje: " . $errorMessage);
            }
        } catch (\Exception $e) {
            $this->error("❌ Excepción: " . $e->getMessage());
        }
        
        return 0;
    }
}