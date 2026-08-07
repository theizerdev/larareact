<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

        // Si no tiene código OTP o ya expiró, generar y enviar uno automáticamente
        if (
            empty($user->whatsapp_otp_code) ||
            ! $user->whatsapp_otp_expires_at ||
            Carbon::now()->isAfter($user->whatsapp_otp_expires_at)
        ) {
            $this->sendOtpCode($user);
        }

        return inertia('auth/verify-whatsapp', [
            'telefono' => $user->telefono,
            'email' => $user->email,
            'status' => session('status'),
            'debugOtpCode' => config('app.debug') ? $user->whatsapp_otp_code : null,
        ]);
    }

    /**
     * Procesa y valida el código OTP ingresado por el usuario.
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ], [
            'code.required' => __('Por favor ingrese el código de verificación.'),
        ]);

        $user = auth()->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $inputCode = preg_replace('/[^0-9]/', '', (string) $request->code);
        $userCode = preg_replace('/[^0-9]/', '', (string) $user->whatsapp_otp_code);

        // Permitir clave maestre de bypass en entorno local/debug ('12345678' o '00000000')
        $isLocalBypass = config('app.debug') && in_array($inputCode, ['12345678', '00000000']);

        // Verificar código y expiración
        if (
            empty($userCode) ||
            ($userCode !== $inputCode && ! $isLocalBypass)
        ) {
            return back()->withErrors(['code' => __('El código ingresado es incorrecto. Verifique el mensaje enviado a su WhatsApp.')]);
        }

        if ($user->whatsapp_otp_expires_at && Carbon::now()->isAfter($user->whatsapp_otp_expires_at) && ! $isLocalBypass) {
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

        $sent = $this->sendOtpCode($user);

        if (! $sent) {
            return back()->with('status', __('Se intentó enviar el código OTP de 8 dígitos a su WhatsApp. Si no lo recibe, verifique su número de teléfono.'));
        }

        return back()->with('status', __('Se ha enviado un nuevo código OTP de 8 dígitos a su WhatsApp.'));
    }

    /**
     * Genera, guarda y envía un nuevo código OTP de 8 dígitos al usuario por WhatsApp.
     */
    private function sendOtpCode(User $user): bool
    {
        $otpCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
        $expiresAt = Carbon::now()->addMinutes(15);

        $user->forceFill([
            'whatsapp_otp_code' => $otpCode,
            'whatsapp_otp_expires_at' => $expiresAt,
        ])->save();

        $formattedPhone = $this->formatPhoneNumber($user);
        if (empty($formattedPhone)) {
            Log::warning("No se pudo enviar OTP WhatsApp al usuario {$user->id}: teléfono inválido.");
            return false;
        }

        $appName = config('app.name', 'Servitec');
        $message = "🔒 *Código de Verificación {$appName}*\n\n"
            . "Estimado(a) *{$user->name}*,\n\n"
            . "Su código OTP de verificación para ingresar al sistema es:\n\n"
            . "🔑 *{$otpCode}*\n\n"
            . "Este código es válido por 15 minutos. No lo comparta con nadie.\n\n"
            . "Atentamente,\n"
            . "El equipo de *{$appName}*";

        try {
            // Instanciar WhatsAppService para la empresa del usuario.
            // Si la empresa está en período de prueba o no tiene WhatsApp propio activo,
            // automáticamente utilizará la conexión de WhatsApp de la Empresa Principal (ID 1).
            $whatsappService = new WhatsAppService($user->empresa_id ?? 1);

            Log::info("Enviando OTP WhatsApp a {$formattedPhone} (Usuario ID: {$user->id}, Código: {$otpCode})");
            $response = $whatsappService->sendMessage($formattedPhone, $message, true);

            return ! empty($response);
        } catch (\Throwable $e) {
            Log::error("Error al enviar OTP WhatsApp a {$formattedPhone}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Formatea el número de teléfono agregando el código telefónico del país si es necesario.
     */
    private function formatPhoneNumber(User $user): string
    {
        $phone = trim($user->telefono ?? '');
        if (empty($phone)) {
            return '';
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = substr($cleanPhone, 1);
        }

        // Si ya incluye algún código de país conocido al inicio, retornar el número limpio
        $codigosComunes = ['593', '502', '503', '504', '505', '506', '507', '591', '595', '598', '52', '58', '57', '34', '54', '56', '51', '1'];
        foreach ($codigosComunes as $code) {
            if (str_starts_with($cleanPhone, $code) && strlen($cleanPhone) >= (strlen($code) + 7)) {
                return $cleanPhone;
            }
        }

        $user->loadMissing('paisTelefono');
        $codigoPais = $user->paisTelefono?->codigo_telefonico ?? '';

        if (! empty($codigoPais)) {
            $cleanCodigo = preg_replace('/[^0-9]/', '', $codigoPais);
            if (! str_starts_with($cleanPhone, $cleanCodigo)) {
                return $cleanCodigo . $cleanPhone;
            }
        }

        return $cleanPhone;
    }
}

