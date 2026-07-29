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
            if ($user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador'))) {
                $hasOpenRegister = CashRegister::where('empresa_id', $user->empresa_id)
                    ->where('status', 'open')
                    ->exists();

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
