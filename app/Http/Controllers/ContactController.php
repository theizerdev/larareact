<?php

namespace App\Http\Controllers;

use App\Models\Empresa;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    /**
     * Procesa la solicitud del formulario de contacto y envía una notificación por WhatsAppService a la Empresa 1.
     */
    public function send(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'business' => ['required', 'string', 'max:255'],
            'country_dial' => ['required', 'string', 'max:10'],
            'phone' => ['required', 'string', 'max:30'],
            'message' => ['nullable', 'string', 'max:1000'],
        ]);

        $cleanDial = preg_replace('/[^0-9]/', '', $validated['country_dial']);
        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
        $fullUserPhone = '+' . $cleanDial . ' ' . $cleanPhone;

        // Empresa Principal (ID 1)
        $empresa1 = Empresa::find(1);
        $rawTargetPhone = $empresa1->telefono;
        $formattedTargetPhone = preg_replace('/[^0-9]/', '', $rawTargetPhone);

        $appName = config('app.name', 'FixSale');
        $whatsappMessage = "📩 *Nueva Solicitud de Contacto - {$appName}*\n\n"
            . "👤 *Nombre:* {$validated['name']}\n"
            . "🏢 *Negocio / Empresa:* {$validated['business']}\n"
            . "📞 *Teléfono de Contacto:* {$fullUserPhone}\n"
            . "💬 *Mensaje / Consulta:* " . ($validated['message'] ?: 'Solicitud de información sobre la plataforma.') . "\n\n"
            . "⏰ *Fecha:* " . now()->format('d/m/Y H:i:s');

        try {
            // Instanciar WhatsAppService para Empresa 1 y enviar el mensaje automáticamente
            $whatsappService = new WhatsAppService(1);
            $whatsappService->sendMessage($formattedTargetPhone, $whatsappMessage, true);

            Log::info("Solicitud de contacto enviada por WhatsAppService a Empresa 1 ({$formattedTargetPhone}) para {$validated['name']}");

            return response()->json([
                'success' => true,
                'message' => __('¡Gracias por contactarnos! Tu mensaje ha sido enviado exitosamente. Un asesor se comunicará contigo a la brevedad.'),
            ]);
        } catch (\Throwable $e) {
            Log::error("Error al enviar mensaje de contacto por WhatsAppService: " . $e->getMessage());

            return response()->json([
                'success' => true,
                'message' => __('¡Gracias por contactarnos! Hemos recibido tu información y un asesor se comunicará contigo muy pronto.'),
            ]);
        }
    }
}
