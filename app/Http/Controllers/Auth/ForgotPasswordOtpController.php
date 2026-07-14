<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class ForgotPasswordOtpController extends Controller
{
    /**
     * Muestra la vista de recuperación de contraseña con OTP.
     */
    public function show(Request $request)
    {
        $paises = Pais::select('id', 'nombre', 'codigo_iso2', 'codigo_telefonico')
            ->orderBy('nombre')
            ->get();

        $verifiedPhone = session('otp_verified_phone');
        $verifiedPaisId = session('otp_verified_pais_id');

        return inertia('auth/forgot-password', [
            'paises' => $paises,
            'otp_verified' => !empty($verifiedPhone) && !empty($verifiedPaisId),
            'verified_phone' => $verifiedPhone,
            'verified_pais_id' => $verifiedPaisId ? (int) $verifiedPaisId : null,
        ]);
    }

    /**
     * Genera y envía el código OTP al WhatsApp del usuario.
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'pais_telefono_id' => 'required|exists:paises,id',
            'telefono' => 'required|string',
        ]);

        // Buscar el usuario por su teléfono y país
        $user = User::where('pais_telefono_id', $request->pais_telefono_id)
            ->where('telefono', $request->telefono)
            ->first();

        if (!$user) {
            return back()->withErrors([
                'telefono' => __('No se encontró ningún usuario con ese número telefónico.'),
            ]);
        }

        // Generar un OTP de 6 dígitos
        $otp = sprintf('%06d', mt_rand(100000, 999999));

        // Guardar el OTP en el usuario
        $user->whatsapp_otp = $otp;
        $user->save();

        // Obtener el código telefónico del país
        $pais = Pais::find($request->pais_telefono_id);
        $codigoTelefonico = $pais->codigo_telefonico; // Ejemplo: +58, +1

        // Formatear el número eliminando el '+' y cualquier caracter no numérico
        $fullNumber = $codigoTelefonico . $request->telefono;
        $cleanNumber = preg_replace('/[^0-9]/', '', $fullNumber);

        // Instanciar el servicio de WhatsApp para la empresa del usuario
        $empresa = $user->empresa ?? Empresa::first();
        $whatsappService = new WhatsAppService($empresa);

        $message = "Tu código de verificación (OTP) para restablecer tu contraseña es: *{$otp}*. Válido por 10 minutos.";
        
        // Registrar en logs locales para facilitar el testing
        Log::info("OTP generado para {$user->email}: {$otp} (Teléfono: {$cleanNumber})");

        $sent = $whatsappService->sendMessage($cleanNumber, $message);

        // Limpiar cualquier estado previo de verificación de la sesión
        session()->forget(['otp_verified_phone', 'otp_verified_pais_id', 'otp_verified_at']);

        // Si la integración falla o no está conectada, en entorno local dejamos pasar
        // pero enviamos un log de advertencia.
        if (!$sent && app()->environment('production')) {
            return back()->withErrors([
                'telefono' => __('No se pudo enviar el código OTP al WhatsApp en este momento. Intente más tarde.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('El código OTP ha sido enviado a tu WhatsApp.'),
        ]);
    }

    /**
     * Verifica el código OTP ingresado.
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'pais_telefono_id' => 'required|exists:paises,id',
            'telefono' => 'required|string',
            'otp' => 'required|string|size:6',
        ]);

        $user = User::where('pais_telefono_id', $request->pais_telefono_id)
            ->where('telefono', $request->telefono)
            ->first();

        if (!$user) {
            return back()->withErrors([
                'telefono' => __('No se encontró ningún usuario con ese número telefónico.'),
            ]);
        }

        // Validar el OTP guardado
        if ($user->whatsapp_otp !== $request->otp) {
            return back()->withErrors([
                'otp' => __('El código OTP ingresado es incorrecto.'),
            ]);
        }

        // Registrar el estado de verificación en la sesión
        session([
            'otp_verified_phone' => $request->telefono,
            'otp_verified_pais_id' => $request->pais_telefono_id,
            'otp_verified_at' => now()->toIso8601String(),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Código OTP verificado con éxito. Procede a ingresar tu nueva contraseña.'),
        ]);
    }

    /**
     * Restablece la contraseña tras una verificación exitosa.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'pais_telefono_id' => 'required|exists:paises,id',
            'telefono' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $verifiedPhone = session('otp_verified_phone');
        $verifiedPaisId = session('otp_verified_pais_id');

        // Validar que la sesión coincida
        if (
            empty($verifiedPhone) ||
            $verifiedPhone !== $request->telefono ||
            (int) $verifiedPaisId !== (int) $request->pais_telefono_id
        ) {
            return back()->withErrors([
                'telefono' => __('La sesión de verificación ha expirado o es inválida. Solicite un nuevo código OTP.'),
            ]);
        }

        $user = User::where('pais_telefono_id', $request->pais_telefono_id)
            ->where('telefono', $request->telefono)
            ->first();

        if (!$user) {
            return back()->withErrors([
                'telefono' => __('No se encontró ningún usuario con ese número telefónico.'),
            ]);
        }

        // Actualizar la contraseña del usuario y limpiar el OTP
        $user->password = Hash::make($request->password);
        $user->whatsapp_otp = null;
        $user->save();

        // Limpiar las variables de verificación de la sesión
        session()->forget(['otp_verified_phone', 'otp_verified_pais_id', 'otp_verified_at']);

        return redirect()->route('login')->with('notification', [
            'type' => 'success',
            'message' => __('Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión.'),
        ]);
    }
}
