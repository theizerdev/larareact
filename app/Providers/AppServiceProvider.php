<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
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
