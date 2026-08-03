<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\WhatsAppService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, mixed>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'company_name' => ['required', 'string', 'max:255'],
            'company_document' => ['nullable', 'string', 'max:255'],
            'representante_legal' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
            'company_phone' => ['nullable', 'string', 'max:255'],
            'pais_id' => ['nullable', 'exists:pais,id'],
        ], [
            'company_name.required' => __('El nombre de la empresa es obligatorio.'),
            'representante_legal.required' => __('El nombre del representante legal es obligatorio.'),
            'email.required' => __('El correo electrónico es obligatorio.'),
            'email.unique' => __('Este correo electrónico ya se encuentra registrado.'),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $phone = $input['company_phone'] ?? ($input['phone'] ?? null);
            $paisId = $input['pais_id'] ?? ($input['pais_telefono_id'] ?? null);

            // 1. Crear Empresa con plan de prueba de 7 días
            $documento = !empty($input['company_document']) ? $input['company_document'] : 'S/D-' . Str::upper(Str::random(6));

            $empresa = Empresa::create([
                'razon_social' => $input['company_name'],
                'documento' => $documento,
                'representante_legal' => $input['representante_legal'],
                'telefono' => $phone,
                'email' => $input['email'],
                'pais_id' => $paisId,
                'pais_telefono_id' => $paisId,
                'status' => true,
                'api_key' => Str::random(32),
                'whatsapp_api_key' => Str::random(32),
                'subscription_status' => 'trial',
                'trial_ends_at' => now()->addDays(7),
                'max_sucursales' => 1,
            ]);

            // 2. Crear Sucursal Principal con los datos de la empresa
            $sucursal = Sucursal::create([
                'empresa_id' => $empresa->id,
                'nombre' => 'Sucursal Principal',
                'pais_telefono_id' => $paisId,
                'telefono' => $phone,
                'direccion' => 'Dirección Principal',
                'status' => true,
            ]);

            // 3. Crear Usuario Administrador asociado a la empresa y sucursal
            $user = User::create([
                'name' => $input['representante_legal'],
                'email' => $input['email'],
                'password' => $input['password'],
                'telefono' => $phone,
                'pais_telefono_id' => $paisId,
                'empresa_id' => $empresa->id,
                'sucursal_id' => $sucursal->id,
                'status' => 'activo',
            ]);

            // 3. Sincronizar rol Administrador
            $user->assignRole('Administrador');

            // 4. Generar código OTP de 8 dígitos para verificación de WhatsApp
            $otpCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
            $user->forceFill([
                'whatsapp_otp_code' => $otpCode,
                'whatsapp_otp_expires_at' => now()->addMinutes(15),
            ])->save();

            // 5. Enviar notificación de bienvenida y código OTP por WhatsApp si hay un teléfono registrado
            if ($phone) {
                $this->sendWhatsAppWelcomeMessage($user, $empresa, $phone, $input['password'], $otpCode);
            }

            return $user;
        });
    }

    /**
     * Enviar mensaje profesional de bienvenida vía WhatsApp con código OTP de 8 dígitos
     */
    private function sendWhatsAppWelcomeMessage(User $user, Empresa $empresa, string $phone, string $plainPassword, string $otpCode): void
    {
        try {
            $appName = config('app.name', 'Servitec');
            $loginUrl = route('login');

            $message = "✨ *¡Bienvenido a {$appName}!* ✨\n\n"
                . "Estimado(a) *{$user->name}*,\n\n"
                . "Nos complace darle la bienvenida a nuestra plataforma. Hemos registrado exitosamente la empresa *{$empresa->razon_social}* con un *Plan de Prueba de 7 días* (acceso total a todos los módulos).\n\n"
                . "🔒 *Su código de verificación OTP de 8 dígitos es:* \n"
                . "👉 *{$otpCode}*\n\n"
                . "Por razones de seguridad, ingrese este código en la pantalla de verificación para activar el acceso a su cuenta.\n\n"
                . "Atentamente,\n"
                . "El equipo de *{$appName}*";

            // Usar la empresa principal del SaaS (ID 1) para notificaciones del sistema de registro
            $whatsappService = new WhatsAppService(1);
            $whatsappService->sendMessage($phone, $message, true, $user->pais_telefono_id ?? $empresa->pais_id);
        } catch (\Throwable $e) {
            Log::error("Error al enviar mensaje de bienvenida WhatsApp a {$phone}: " . $e->getMessage());
        }
    }
}

