<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

use App\Models\CashRegister;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Event;

class AppServiceProvider extends ServiceProvider
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
        $this->configureDefaults();

        Event::listen(Login::class, function (Login $event) {
            $user = $event->user;
            $request = request();

            $properties = [
                'ip' => $request->ip(),
                'user_agent' => $request->header('User-Agent'),
                'login_at' => now()->toIso8601String(),
            ];

            if ($request->filled('latitude') && $request->filled('longitude')) {
                $properties['latitude'] = $request->input('latitude');
                $properties['longitude'] = $request->input('longitude');
            }

            // Guardar registro de actividad de inicio de sesión seguro
            activity('auth')
                ->causedBy($user)
                ->performedOn($user)
                ->withProperties($properties)
                ->log('user_logged_in');

            if ($user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador'))) {
                $hasOpenRegister = CashRegister::hasOpenRegister($user);

                if (! $hasOpenRegister) {
                    session()->flash('notification', [
                        'type' => 'warning',
                        'message' => __('Atención: No existe ninguna caja aperturada para el día de hoy en su empresa.'),
                    ]);
                }
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
