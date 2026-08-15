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

        // Grant Super Administrador global bypass on all policies and gate checks
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            if ($user->id === 1
                || $user->hasRole('Super Administrador')
                || $user->hasRole('super-admin')
                || $user->hasRole('Super Admin')
                || \Illuminate\Support\Facades\DB::table('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->where('model_has_roles.model_id', $user->id)
                    ->whereIn('roles.name', ['Super Administrador', 'super-admin', 'Super Admin'])
                    ->exists()
            ) {
                return true;
            }

            return null;
        });

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

            // Resetear el flag de sesión para permitir evaluar el primer ingreso de la sesión
            session()->forget('whatsapp_first_redirect_done');
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
