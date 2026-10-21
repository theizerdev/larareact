<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Console\ServeCommand;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // `php artisan serve` sólo hereda las variables de esta lista. En Windows, sin TMP/TEMP
        // el PHP del servidor cae a C:\Windows como carpeta temporal, no puede escribir y
        // descarta los POST grandes (p. ej. las fotos del enrolamiento) con "POST data can't be buffered".
        ServeCommand::$passthroughVariables = [...ServeCommand::$passthroughVariables, 'TMP', 'TEMP'];
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
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

        Password::defaults(function (): Password {
            $min = 15;
            try {
                if (\Illuminate\Support\Facades\Schema::hasTable('configuraciones_sox')) {
                    $min = \App\Models\ConfiguracionSox::current()->min_password_length ?? 15;
                }
            } catch (\Throwable) {
                $min = 15;
            }

            $rule = Password::min($min)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols();

            if (app()->isProduction()) {
                $rule->uncompromised();
            }

            return $rule;
        });
    }
}
