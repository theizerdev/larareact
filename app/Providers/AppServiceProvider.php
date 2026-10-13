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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->permitirTemporalesEnServidorDeDesarrollo();

        \Illuminate\Support\Facades\Event::subscribe(\App\Listeners\LogAuthenticationActivity::class);
    }

    /**
     * Deja que `artisan serve` herede TMP y TEMP.
     *
     * El comando arranca el servidor embebido con una lista blanca de
     * variables de entorno que no las incluye. En Windows eso deja a PHP sin
     * directorio temporal: sys_get_temp_dir() cae a C:\WINDOWS, que no es
     * escribible, y entonces *ninguna* subida de archivos funciona —los
     * $_FILES llegan con error 6, UPLOAD_ERR_NO_TMP_DIR— además de reventar
     * cualquier llamada a tempnam().
     *
     * Sólo afecta al servidor de desarrollo; bajo nginx, Apache o Herd el
     * entorno ya trae esas variables.
     */
    protected function permitirTemporalesEnServidorDeDesarrollo(): void
    {
        if (! class_exists(ServeCommand::class)) {
            return;
        }

        foreach (['TMP', 'TEMP'] as $variable) {
            if (! in_array($variable, ServeCommand::$passthroughVariables, true)) {
                ServeCommand::$passthroughVariables[] = $variable;
            }
        }
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
