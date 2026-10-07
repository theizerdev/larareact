<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureActions();
        $this->configureViews();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);

        Fortify::authenticateUsing(function (Request $request) {
            $login = $request->input(Fortify::username());
            $password = $request->input('password');

            $user = \App\Models\User::where('email', $login)
                ->orWhere('username', $login)
                ->first();

            if (!$user) {
                return null;
            }

            $soxConfig = \App\Models\ConfiguracionSox::current($user->empresa_id);

            // Check if user is locked
            if ($user->isLocked()) {
                $minutes = $user->lockoutRemainingMinutes();
                throw \Illuminate\Validation\ValidationException::withMessages([
                    Fortify::username() => [
                        "Esta cuenta está temporalmente bloqueada por superar el límite de {$soxConfig->max_failed_attempts} intentos fallidos. Contacte al administrador para solicitar el desbloqueo.",
                    ],
                ]);
            }

            if (\Illuminate\Support\Facades\Hash::check($password, $user->password)) {
                $user->update([
                    'failed_login_attempts' => 0,
                    'locked_until' => null,
                ]);

                return $user;
            }

            // Failed password attempt
            $attempts = $user->failed_login_attempts + 1;
            $maxAttempts = $soxConfig->max_failed_attempts;
            $lockoutMinutes = $soxConfig->lockout_minutes;

            if ($attempts >= $maxAttempts) {
                $user->update([
                    'failed_login_attempts' => $attempts,
                    'locked_until' => now()->addMinutes($lockoutMinutes),
                ]);

                activity('auth')
                    ->causedBy($user)
                    ->performedOn($user)
                    ->withProperties([
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'evento' => 'sox_lockout',
                        'intentos' => $attempts,
                        'minutos_bloqueo' => $lockoutMinutes,
                    ])
                    ->event('sox_lockout')
                    ->log("Cuenta de {$user->name} bloqueada por {$lockoutMinutes} min tras {$attempts} intentos fallidos");

                throw \Illuminate\Validation\ValidationException::withMessages([
                    Fortify::username() => [
                        "Ha alcanzado el límite de {$maxAttempts} intentos fallidos. Su cuenta ha sido bloqueada por seguridad.",
                    ],
                ]);
            } else {
                $user->update([
                    'failed_login_attempts' => $attempts,
                ]);
            }

            return null;
        });
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(10)->by(
                ($request->input('credential.id') ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
    }
}
