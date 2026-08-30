<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Models\Empresa;
use App\Models\Pais;
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
            'nombre_comercial' => ['nullable', 'string', 'max:255'],
            'representante_legal' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => $this->passwordRules(),
            'company_phone' => ['nullable', 'string', 'max:255'],
            'pais_id' => ['nullable', 'exists:pais,id'],
        ], [
            'company_name.required' => __('El nombre de la empresa es obligatorio.'),
            'representante_legal.required' => __('El nombre del representante legal es obligatorio.'),
            'email.required' => __('El correo electrónico es obligatorio.'),
            'email.unique' => __('Este correo electrónico ya se encuentra registrado.'),
        ])->validate();

        $createdEmpresa = null;
        $createdUser = null;
        $otpCode = null;

        $createdUser = DB::transaction(function () use ($input, &$createdEmpresa, &$otpCode) {
            $phone = $input['company_phone'] ?? ($input['phone'] ?? null);
            $paisId = $input['pais_id'] ?? ($input['pais_telefono_id'] ?? null);
            $nombreComercial = ! empty($input['nombre_comercial']) ? trim($input['nombre_comercial']) : null;

            // 1. Crear Empresa con plan de prueba de 7 días
            $documento = !empty($input['company_document']) ? $input['company_document'] : 'S/D-' . Str::upper(Str::random(6));

            $empresa = Empresa::create([
                'razon_social' => $input['company_name'],
                'nombre_comercial' => $nombreComercial,
                'documento' => $documento,
                'representante_legal' => $input['representante_legal'],
                'telefono' => $phone,
                'email' => $input['email'],
                'pais_id' => $paisId,
                'pais_telefono_id' => $paisId,
                'status' => true,
                'api_key' => Str::random(32),
                'whatsapp_api_key' => Str::random(32),
                'whatsapp_api_url' => config('whatsapp.api_url', 'http://169.58.168.213:3000'),
                'whatsapp_active' => true,
                'whatsapp_status' => 'disconnected',
                'subscription_status' => 'trial',
                'trial_ends_at' => now()->addDays(7),
                'max_sucursales' => 1,
            ]);

            // Crear el nombre de instancia agrupado y limpio para WhatsApp (ej: "Bajo el Reloj" -> "bajoelreloj")
            $baseForInstance = $nombreComercial ?: $input['company_name'];
            $cleanInstanceName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(['/', ' '], '', strtolower($baseForInstance)));
            if (empty($cleanInstanceName)) {
                $cleanInstanceName = 'empresa_'.$empresa->id;
            }

            $empresa->update([
                'whatsapp_instance' => $cleanInstanceName,
            ]);

            $trialPlan = \App\Models\SubscriptionPlan::where('nombre', 'like', '%Prueba%')->first()
                ?? \App\Models\SubscriptionPlan::first();

            \App\Models\Subscription::create([
                'empresa_id' => $empresa->id,
                'plan_id' => $trialPlan?->id,
                'nombre_plan' => 'Prueba Gratuita',
                'ciclo_meses' => 0,
                'max_sucursales' => 1,
                'monto_total' => 0.00,
                'fecha_inicio' => now(),
                'fecha_vencimiento' => now()->addDays(7),
                'estado' => 'trial',
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

            // 3. Sincronizar rol Administrador exclusivo para la nueva empresa
            setPermissionsTeamId($empresa->id);

            $adminRole = \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => 'Administrador',
                'guard_name' => 'web',
                'empresa_id' => $empresa->id,
            ]);

            $permissions = \Spatie\Permission\Models\Permission::where('name', '!=', 'subscriptions.manage')->get();
            $adminRole->syncPermissions($permissions);

            $user->assignRole($adminRole);

            // 4. Generar código OTP de 8 dígitos para verificación de WhatsApp
            $otpCode = str_pad((string) random_int(0, 99999999), 8, '0', STR_PAD_LEFT);
            $user->forceFill([
                'whatsapp_otp_code' => $otpCode,
                'whatsapp_otp_expires_at' => now()->addMinutes(15),
            ])->save();

            $createdEmpresa = $empresa;

            return $user;
        });

        // 5. Aprovisionamiento asíncrono de la base de datos del tenant
        if ($createdEmpresa) {
            $phone = $input['company_phone'] ?? ($input['phone'] ?? null);
            $paisId = $input['pais_id'] ?? ($input['pais_telefono_id'] ?? null);

            \App\Jobs\ProvisionTenantDatabaseJob::dispatch($createdEmpresa->id, [
                'telefono' => $phone,
                'pais_telefono_id' => $paisId,
                'direccion' => 'Dirección Principal',
            ]);
        }

        $phone = $input['company_phone'] ?? ($input['phone'] ?? null);
        if ($phone && $createdUser && $createdEmpresa && $otpCode) {
            $this->sendWhatsAppWelcomeMessage($createdUser, $createdEmpresa, $phone, $input['password'], $otpCode);
        }

        return $createdUser;
    }

    /**
     * Enviar mensaje profesional de bienvenida vía WhatsApp con código OTP de 8 dígitos
     */
    private function sendWhatsAppWelcomeMessage(User $user, Empresa $empresa, string $phone, string $plainPassword, string $otpCode): void
    {
        try {
            $appName = config('app.name', 'Servitec');

            $formattedPhone = trim($phone);
            if ($user->pais_telefono_id) {
                $pais = Pais::find($user->pais_telefono_id);
                if ($pais && ! empty($pais->codigo_telefonico)) {
                    $cleanCodigo = preg_replace('/[^0-9]/', '', $pais->codigo_telefonico);
                    $cleanPhone = preg_replace('/[^0-9]/', '', $formattedPhone);
                    $cleanPhone = ltrim($cleanPhone, '0');
                    if (! str_starts_with($cleanPhone, $cleanCodigo)) {
                        $formattedPhone = $cleanCodigo . $cleanPhone;
                    } else {
                        $formattedPhone = $cleanPhone;
                    }
                }
            }

            $message = 
                "🔐 *Conecta tu WhatsApp de forma segura*\n\n"
                . "¡Gracias por confiar en FixSale! Estamos comprometidos en brindarte una plataforma confiable, automatizada y segura para facilitar la gestión de tu negocio.\n\n"
                . "Para comenzar y activar correctamente las funciones de comunicación, necesitamos realizar un paso sencillo y seguro: vincular tu cuenta de WhatsApp.\n\n"
                . "🔑 *Su código de verificación OTP de 8 dígitos es:* *{$otpCode}*\n\n"
                . "📱 Solo tienes que escanear el código QR que aparece en pantalla desde la aplicación de WhatsApp de tu teléfono.\n\n"
                . "¿Cómo hacerlo?\n\n"
                . "Abre WhatsApp en tu teléfono.\n"
                . "Ve a Dispositivos vinculados.\n"
                . "Selecciona Vincular un dispositivo.\n"
                . "Escanea el código QR que aparece en FixSale.\n\n"
                . "🔒 Tu seguridad es nuestra prioridad. Este proceso se realiza mediante la función oficial de dispositivos vinculados de WhatsApp. Nunca te solicitaremos tu contraseña ni códigos de verificación.\n\n"
                . "Una vez vinculado, podrás disfrutar de una experiencia más rápida, automatizada y profesional.\n\n"
                . "👉 Escanea el código QR para continuar.";

            // Usar la empresa principal del SaaS (ID 1) para notificaciones con un timeout corto de 4 segundos
            $whatsappService = new WhatsAppService(1);
            $whatsappService->setTimeout(4);
            $whatsappService->sendMessage($formattedPhone, $message, true);
        } catch (\Throwable $e) {
            Log::error("Error al enviar mensaje de bienvenida WhatsApp a {$phone}: " . $e->getMessage());
        }
    }
}


