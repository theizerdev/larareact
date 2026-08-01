<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class WhatsAppVerificationController extends Controller
{
    /**
     * Muestra la pantalla para ingresar el código OTP de 8 dígitos.
     */
    public function show(Request $request)
    {
        $user = auth()->user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Si ya fue verificado o no tiene número de teléfono, permitir continuar
        if ($user->whatsapp_verified_at || empty($user->telefono)) {
            return redirect()->route('dashboard');
        }

        return inertia('auth/verify-whatsapp', [
            'telefono' => $user->telefono,
            'email' => $user->email,
            'status' => session('status'),
        ]);
    }

    /**
     * Procesa y valida el código OTP ingresado por el usuario.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string', 'size:8'],
        ], [
            'code.required' => __('Por favor ingrese el código de verificación.'),
            'code.size' => __('El código debe ser exactamente de 8 dígitos.'),
        ]);

        $user = auth()->user();

        if (! $user) {
            return redirect()->route('login');
        }

        // Verificar código y expiración
        if (
            empty($user->whatsapp_otp_code) ||
            $user->whatsapp_otp_code !== trim($request->code)
        ) {
            return back()->withErrors(['code' => __('El código ingresado es incorrecto. Verifique el mensaje enviado a su WhatsApp.')]);
        }

        if ($user->whatsapp_otp_expires_at && Carbon::now()->isAfter($user->whatsapp_otp_expires_at)) {
            return back()->withErrors(['code' => __('El código de verificación ha expirado. Por favor solicite uno nuevo.')]);
        }

        // Marcar como verificado
        $user->forceFill([
            'whatsapp_verified_at' => Carbon::now(),
            'whatsapp_otp_code' => null,
            'whatsapp_otp_expires_at' => null,
        ])->save();

        return redirect()->route('dashboard')->with('status', __('¡Teléfono verificado con éxito! Bienvenido al sistema.'));
    }

    /**
     * Reenvía un nuevo código OTP de 8 dígitos vía WhatsApp.
     */
    public function resend(Request $request)
    {
        $user = auth()->user();

        if (! $user || empty($user->telefono)) {
            return back()->withErrors(['code' => __('No se encontró un número de teléfono válido.')]);
        }

        $otpCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        $expiresAt = Carbon::now()->addMinutes(15);

        $user->forceFill([
            'whatsapp_otp_code' => $otpCode,
            'whatsapp_otp_expires_at' => $expiresAt,
        ])->save();

        $appName = config('app.name', 'Servitec');
        $message = "🔒 *Código de Verificación {$appName}*\n\n"
            . "Estimado(a) *{$user->name}*,\n\n"
            . "Su código OTP de verificación para ingresar al sistema es:\n\n"
            . "🔑 *{$otpCode}*\n\n"
            . "Este código es válido por 15 minutos. No lo comparta con nadie.\n\n"
            . "Atentamente,\n"
            . "El equipo de *{$appName}*";

        try {
            // Usar la empresa principal del sistema SaaS (ID 1) para notificaciones y OTPs de registro
            $whatsappService = new WhatsAppService(1);
            $whatsappService->sendMessage($user->telefono, $message, true);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error reenviando OTP WhatsApp: ' . $e->getMessage());
        }

        return back()->with('status', __('Se ha enviado un nuevo código OTP de 8 dígitos a su WhatsApp.'));
    }
}
