<?php

namespace TheizerDev\LaraReact;

use Illuminate\Support\ServiceProvider;
use TheizerDev\LaraReact\Console\InstallCommand;

class LaraReactServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../config/larareact.php', 'larareact'
        );

        $this->registerFortifyFallbacks();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'larareact');

        $this->publishes([
            __DIR__.'/../config/larareact.php' => config_path('larareact.php'),
        ], 'larareact-config');

        $this->publishes([
            __DIR__.'/../resources/js' => resource_path('js'),
            __DIR__.'/../resources/css' => resource_path('css'),
            __DIR__.'/../resources/views' => resource_path('views'),
        ], 'larareact-assets');

        $this->publishes([
            __DIR__.'/../app/Providers/FortifyServiceProvider.php' => app_path('Providers/FortifyServiceProvider.php'),
            __DIR__.'/../app/Http/Middleware/HandleAppearance.php' => app_path('Http/Middleware/HandleAppearance.php'),
            __DIR__.'/../app/Http/Middleware/HandleInertiaRequests.php' => app_path('Http/Middleware/HandleInertiaRequests.php'),
            __DIR__.'/../app/Http/Controllers/Settings' => app_path('Http/Controllers/Settings'),
            __DIR__.'/../app/Http/Requests/Settings' => app_path('Http/Requests/Settings'),
            __DIR__.'/../app/Actions/Fortify' => app_path('Actions/Fortify'),
            __DIR__.'/../app/Concerns' => app_path('Concerns'),
            __DIR__.'/../routes/web.php' => base_path('routes/larareact.php'),
            __DIR__.'/../routes/settings.php' => base_path('routes/larareact-settings.php'),
        ], 'larareact-app');

        $this->publishes([
            __DIR__.'/../package.json' => base_path('package.json'),
            __DIR__.'/../vite.config.ts' => base_path('vite.config.ts'),
            __DIR__.'/../tsconfig.json' => base_path('tsconfig.json'),
        ], 'larareact-build');

        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallCommand::class,
                Console\DbCommand::class,
            ]);
        }
    }

    /**
     * Register fallback bindings for Fortify's view response contracts
     * to prevent "not instantiable" errors before installation is completed.
     */
    protected function registerFortifyFallbacks(): void
    {
        if (class_exists(\Laravel\Fortify\Fortify::class)) {
            $this->app->bindIf(\Laravel\Fortify\Contracts\LoginViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\LoginViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\RegisterViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\RegisterViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\ResetPasswordViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\ResetPasswordViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\RequestPasswordResetLinkViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\RequestPasswordResetLinkViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\VerifyEmailViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\VerifyEmailViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
            $this->app->bindIf(\Laravel\Fortify\Contracts\ConfirmPasswordViewResponse::class, fn () => new class implements \Laravel\Fortify\Contracts\ConfirmPasswordViewResponse {
                public function toResponse($request) { return response('Please run php artisan larareact:install to complete the setup.', 503); }
            });
        }
    }
}
