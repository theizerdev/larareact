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
