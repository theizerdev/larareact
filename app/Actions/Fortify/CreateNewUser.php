<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Empresa;
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
            'company_document' => ['required', 'string', 'max:255', 'unique:empresas,documento'],
            'representante_legal' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
            'company_phone' => ['nullable', 'string', 'max:255'],
            'pais_id' => ['nullable', 'exists:pais,id'],
        ], [
            'company_name.required' => __('El nombre de la empresa es obligatorio.'),
            'company_document.required' => __('El documento o RIF de la empresa es obligatorio.'),
            'company_document.unique' => __('Este documento de empresa ya se encuentra registrado.'),
            'representante_legal.required' => __('El nombre del representante legal es obligatorio.'),
            'email.required' => __('El correo electrónico es obligatorio.'),
            'email.unique' => __('Este correo electrónico ya se encuentra registrado.'),
        ])->validate();

        return DB::transaction(function () use ($input) {
            $phone = $input['company_phone'] ?? ($input['phone'] ?? null);
            $paisId = $input['pais_id'] ?? ($input['pais_telefono_id'] ?? null);

            // 1. Crear Empresa con plan de prueba de 7 días
            $empresa = Empresa::create([
                'razon_social' => $input['company_name'],
                'documento' => $input['company_document'],
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

            // 2. Crear Usuario Administrador asociado a la empresa
            $user = User::create([
                'name' => $input['representante_legal'],
                'email' => $input['email'],
                'password' => $input['password'],
                'telefono' => $phone,
                'pais_telefono_id' => $paisId,
                'empresa_id' => $empresa->id,
                'status' => 'activo',
            ]);

            // 3. Sincronizar rol Administrador
            $user->assignRole('Administrador');

            // 4. Enviar notificación de bienvenida por WhatsApp si hay un teléfono registrado
            if ($phone) {
                $this->sendWhatsAppWelcomeMessage($user, $empresa, $phone, $input['password']);
            }

            return $user;
        });
    }

    /**
     * Enviar mensaje profesional de bienvenida vía WhatsApp
     */
    private function sendWhatsAppWelcomeMessage(User $user, Empresa $empresa, string $phone, string $plainPassword): void
    {
        try {
            $appName = config('app.name', 'Servitec');
            $loginUrl = route('login');

            $message = "✨ *¡Bienvenido a {$appName}!* ✨\n\n"
                . "Estimado(a) *{$user->name}*,\n\n"
                . "Nos complace darle la bienvenida a nuestra plataforma. Hemos registrado exitosamente la empresa *{$empresa->razon_social}* con un *Plan de Prueba de 7 días* completamente funcional.\n\n"
                . "A continuación, le compartimos sus credenciales de acceso:\n"
                . "🌐 *Portal de Acceso:* {$loginUrl}\n"
                . "✉️ *Correo Electrónico:* {$user->email}\n"
                . "🔑 *Contraseña:* {$plainPassword}\n\n"
                . "Por razones de seguridad, le recomendamos guardar estos datos de forma confidencial.\n\n"
                . "Estamos a su entera disposición para asistirle en todo momento. ¡Gracias por confiar en nosotros!\n\n"
                . "Atentamente,\n"
                . "El equipo de *{$appName}*";

            $whatsappService = new WhatsAppService($empresa);
            $whatsappService->sendMessage($phone, $message, true);
        } catch (\Throwable $e) {
            Log::error("Error al enviar mensaje de bienvenida WhatsApp a {$phone}: " . $e->getMessage());
        }
    }
}

