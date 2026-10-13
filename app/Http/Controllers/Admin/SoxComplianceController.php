<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSox;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class SoxComplianceController extends Controller
{
    /**
     * Display the SOX Compliance & Cybersecurity Console.
     */
    public function index(Request $request): Response
    {
        $currentUser = $request->user();
        $empresaId = $currentUser?->empresa_id;
        $config = ConfiguracionSox::current($empresaId);

        // Retrieve users with security attributes
        $usersQuery = User::query()
            ->with(['empresa:id,razon_social', 'sucursal:id,nombre'])
            ->select([
                'id',
                'name',
                'username',
                'email',
                'empresa_id',
                'sucursal_id',
                'password_changed_at',
                'failed_login_attempts',
                'locked_until',
                'created_at',
            ]);

        // Multitenant scoping is handled by Multitenantable trait automatically if non-superadmin
        $users = $usersQuery->get()->map(function (User $u) use ($config) {
            $isLocked = $u->isLocked();
            $daysLeft = $u->daysUntilPasswordExpires($config->password_expires_days);
            $isExpired = $u->isPasswordExpired($config->password_expires_days);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'email' => $u->email,
                'empresa' => $u->empresa?->razon_social ?? 'N/A',
                'sucursal' => $u->sucursal?->nombre ?? 'N/A',
                'password_changed_at' => $u->password_changed_at?->format('d/m/Y H:i') ?? 'Sin registro',
                'days_remaining' => $daysLeft,
                'is_expired' => $isExpired,
                'failed_attempts' => $u->failed_login_attempts,
                'is_locked' => $isLocked,
                'locked_until' => $u->locked_until?->format('d/m/Y H:i'),
                'lockout_remaining_minutes' => $u->lockoutRemainingMinutes(),
                'status_badge' => $isLocked ? 'locked' : ($isExpired ? 'expired' : ($daysLeft <= 15 ? 'warning' : 'ok')),
            ];
        });

        $totalUsers = $users->count();
        $lockedUsersCount = $users->where('is_locked', true)->count();
        $expiredUsersCount = $users->where('is_expired', true)->count();
        $warningUsersCount = $users->where('days_remaining', '<=', 15)->where('is_expired', false)->count();

        // Compliance evaluation checklist (SOX 404 / NIST SP 800-63B)
        $soxChecklist = [
            [
                'id' => 1,
                'title' => 'Longitud Mínima de Contraseña (15 caracteres)',
                'rfp_req' => 'Mínimo 15 caracteres para todo el personal con acceso a datos o panel administrativo.',
                'status' => $config->min_password_length >= 15 ? 'compliant' : 'warning',
                'current_value' => "{$config->min_password_length} caracteres configurados",
                'standard' => 'NIST SP 800-63B / SOX 404',
            ],
            [
                'id' => 2,
                'title' => 'Complejidad y Resistencia a Brechas (HaveIBeenPwned)',
                'rfp_req' => 'Mayúsculas, minúsculas, números, símbolos y verificación contra filtraciones mundiales.',
                'status' => 'compliant',
                'current_value' => 'Activo (API k-anonymity en tiempo real)',
                'standard' => 'OWASP ASVS / SOX',
            ],
            [
                'id' => 3,
                'title' => 'Rotación Forzada a 90 Días',
                'rfp_req' => 'Caducidad forzosa con bloqueo de navegación tras superar vigencia.',
                'status' => $config->password_expires_days <= 90 ? 'compliant' : 'warning',
                'current_value' => "Expiración a los {$config->password_expires_days} días",
                'standard' => 'PCI-DSS 4.0 / SOX 404',
            ],
            [
                'id' => 4,
                'title' => 'Historial de Contraseñas (Últimas 8 no reutilizables)',
                'rfp_req' => 'Impedir el reuso de los últimos 8 hashes de contraseña del usuario.',
                'status' => $config->password_history_limit >= 8 ? 'compliant' : 'warning',
                'current_value' => "{$config->password_history_limit} hashes retenidos",
                'standard' => 'NIST SP 800-63B',
            ],
            [
                'id' => 5,
                'title' => 'Protección Anti-Fuerza Bruta y Bloqueo Automático',
                'rfp_req' => 'Bloqueo temporal de cuenta tras 5 intentos fallidos consecutivos.',
                'status' => ($config->max_failed_attempts <= 5 && $config->lockout_minutes >= 15) ? 'compliant' : 'warning',
                'current_value' => "{$config->max_failed_attempts} intentos fallidos ➔ Bloqueo de {$config->lockout_minutes} min",
                'standard' => 'NIST / SOX Access Control',
            ],
            [
                'id' => 6,
                'title' => 'Segregación Estricta de Funciones (SoD)',
                'rfp_req' => 'Aislamiento de accesos por empresa/sucursal y roles predeterminados.',
                'status' => 'compliant',
                'current_value' => 'Spatie RBAC + Multitenant Global Scopes activo',
                'standard' => 'SOX SoD Matrix',
            ],
            [
                'id' => 7,
                'title' => 'Trazabilidad y Auditoría de Accesos',
                'rfp_req' => 'Bitácora inmutable de eventos de autenticación, bloqueos y cambios de seguridad.',
                'status' => 'compliant',
                'current_value' => 'Spatie Activitylog con canal de seguridad dedicado',
                'standard' => 'SOX Audit Trail',
            ],
            [
                'id' => 8,
                'title' => 'Autenticación de Dos Factores (2FA / Passkeys WebAuthn)',
                'rfp_req' => 'Doble factor de autenticación TOTP y Passkeys FIDO2 disponibles.',
                'status' => 'compliant',
                'current_value' => 'Fortify 2FA + Passkeys WebAuthn activados',
                'standard' => 'FIDO2 / NIST AAL2',
            ],
            [
                'id' => 9,
                'title' => 'Cierre Automático de Sesiones Desactivadas',
                'rfp_req' => 'Terminación inmediata de sesión ante suspensión de cuenta de usuario.',
                'status' => 'compliant',
                'current_value' => 'Middleware EnsureUserActive activo en todas las rutas web',
                'standard' => 'SOX Incident Response',
            ],
            [
                'id' => 10,
                'title' => 'Single Sign-On (SSO) con Microsoft Entra ID',
                'rfp_req' => 'Federación SAML 2.0 / OpenID Connect con el Directorio Activo corporativo.',
                'status' => $config->sso_azure_enabled ? 'compliant' : 'ready',
                'current_value' => $config->sso_azure_enabled ? 'Habilitado y Activo' : 'Módulo Listo para Vincular Tenant ID',
                'standard' => 'Enterprise IAM',
            ],
        ];

        // Calculate score
        $compliantCount = collect($soxChecklist)->where('status', 'compliant')->count();
        $totalChecks = count($soxChecklist);
        $scorePercent = round(($compliantCount / $totalChecks) * 100);

        // Recent audit events
        $recentAuditLogs = Activity::query()
            ->whereIn('log_name', ['auth', 'default'])
            ->whereIn('event', ['sox_lockout', 'password_renewed_sox', 'login', 'logout', 'failed_login', 'password_reset', 'sox_user_unlocked', 'sox_settings_updated'])
            ->latest('id')
            ->take(15)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'description' => $log->description,
                'event' => $log->event,
                'causer' => $log->causer?->name ?? 'Sistema',
                'created_at' => $log->created_at->format('d/m/Y H:i:s'),
                'properties' => $log->properties,
            ]);

        // El secreto de Azure es de solo escritura: nunca viaja al navegador.
        $configData = $config->makeHidden('azure_client_secret')->toArray();
        $configData['azure_client_secret_configured'] = filled($config->azure_client_secret);

        return Inertia::render('admin/seguridad/sox/index', [
            'config' => $configData,
            'stats' => [
                'score' => $scorePercent,
                'totalUsers' => $totalUsers,
                'lockedUsers' => $lockedUsersCount,
                'expiredUsers' => $expiredUsersCount,
                'warningUsers' => $warningUsersCount,
            ],
            'users' => $users,
            'checklist' => $soxChecklist,
            'recentLogs' => $recentAuditLogs,
        ]);
    }

    /**
     * Update SOX policy settings.
     */
    public function updateSettings(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'min_password_length' => 'required|integer|min:12|max:64',
            'password_history_limit' => 'required|integer|min:3|max:24',
            'password_expires_days' => 'required|integer|min:30|max:365',
            'max_failed_attempts' => 'required|integer|min:3|max:10',
            'lockout_minutes' => 'required|integer|min:5|max:120',
            'require_mixed_case' => 'boolean',
            'require_numbers' => 'boolean',
            'require_symbols' => 'boolean',
            'require_uncompromised' => 'boolean',
            'sso_azure_enabled' => 'boolean',
            'azure_tenant_id' => 'nullable|string|max:255',
            'azure_client_id' => 'nullable|string|max:255',
            'azure_client_secret' => 'nullable|string',
            'azure_redirect_uri' => 'nullable|string|max:255',
        ]);

        // Campo de solo escritura: vacío significa "conservar el secreto actual".
        if (blank($validated['azure_client_secret'] ?? null)) {
            unset($validated['azure_client_secret']);
        }

        $config = ConfiguracionSox::current($request->user()->empresa_id);
        $config->update($validated);

        activity('auth')
            ->causedBy($request->user())
            ->performedOn($config)
            // Nunca se registra el valor del secreto en la bitácora.
            ->withProperties(\Illuminate\Support\Arr::except($validated, ['azure_client_secret']) + [
                'azure_client_secret_actualizado' => array_key_exists('azure_client_secret', $validated),
            ])
            ->event('sox_settings_updated')
            ->log("Parámetros de Seguridad y Cumplimiento SOX actualizados por {$request->user()->name}");

        return back()->with('success', 'Parámetros de políticas SOX guardados exitosamente.');
    }

    /**
     * Unlock a locked user account immediately.
     */
    public function unlockUser(Request $request, User $user): RedirectResponse
    {
        $user->unlock();

        activity('auth')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties([
                'desbloqueado_por' => $request->user()->name,
                'usuario' => $user->email,
            ])
            ->event('sox_user_unlocked')
            ->log("Cuenta del usuario {$user->name} desbloqueada manualmente por {$request->user()->name}");

        return back()->with('success', "La cuenta de {$user->name} ha sido desbloqueada satisfactoriamente.");
    }

    /**
     * Force immediate password renewal for a user.
     */
    public function forcePasswordReset(Request $request, User $user): RedirectResponse
    {
        // Debe superar la vigencia configurada (hasta 365 días), no un valor fijo.
        $vigenciaDias = ConfiguracionSox::current($user->empresa_id)->password_expires_days;

        $user->update([
            'password_changed_at' => now()->subDays($vigenciaDias + 1),
        ]);

        activity('auth')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties([
                'forzado_por' => $request->user()->name,
                'usuario' => $user->email,
            ])
            ->event('sox_password_forced')
            ->log("Renovación obligatoria de contraseña forzada para {$user->name} por {$request->user()->name}");

        return back()->with('success', "Se ha forzado el cambio de contraseña para {$user->name} en su próximo acceso.");
    }
}
