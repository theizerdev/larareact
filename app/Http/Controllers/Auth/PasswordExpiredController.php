<?php

namespace App\Http\Controllers\Auth;

use App\Concerns\PasswordValidationRules;
use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSox;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PasswordExpiredController extends Controller
{
    use PasswordValidationRules;

    /**
     * Show the mandatory SOX password renewal page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login');
        }

        // If not expired, go to dashboard
        if (!$user->isPasswordExpired()) {
            return redirect()->route('dashboard');
        }

        $config = ConfiguracionSox::current($user->empresa_id);

        return Inertia::render('auth/password-expired', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'daysSinceChange' => $user->password_changed_at ? (int) $user->password_changed_at->diffInDays(now()) : 90,
            'policies' => [
                'minLength' => $config->min_password_length,
                'historyLimit' => $config->password_history_limit,
                'expireDays' => $config->password_expires_days,
                'requireMixedCase' => $config->require_mixed_case,
                'requireNumbers' => $config->require_numbers,
                'requireSymbols' => $config->require_symbols,
                'requireUncompromised' => $config->require_uncompromised,
            ],
        ]);
    }

    /**
     * Process mandatory password update.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => $this->currentPasswordRules(),
            'password' => $this->passwordRules($user),
        ], [
            'current_password.current_password' => 'La contraseña actual no es correcta.',
            'password.confirmed' => 'La confirmación de la nueva contraseña no coincide.',
        ]);

        $user->update([
            'password' => $request->password,
        ]);

        $user->recordPasswordHistory($user->password);

        activity('auth')
            ->causedBy($user)
            ->performedOn($user)
            ->withProperties([
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'evento' => 'password_renewed_sox',
            ])
            ->event('password_renewed_sox')
            ->log("Renovación de contraseña completada por política SOX ({$user->name})");

        return redirect()->route('dashboard')
            ->with('status', 'Contraseña actualizada con éxito según la política de seguridad SOX.');
    }
}
