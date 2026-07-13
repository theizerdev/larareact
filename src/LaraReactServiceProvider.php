<?php

namespace TheizerDev\LaraReact;

use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Contracts\ConfirmPasswordViewResponse;
use Laravel\Fortify\Contracts\LoginViewResponse;
use Laravel\Fortify\Contracts\RegisterViewResponse;
use Laravel\Fortify\Contracts\RequestPasswordResetLinkViewResponse;
use Laravel\Fortify\Contracts\ResetPasswordViewResponse;
use Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse;
use Laravel\Fortify\Contracts\VerifyEmailViewResponse;
use Laravel\Fortify\Fortify;
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
            __DIR__.'/../public/image' => public_path('image'),
            __DIR__.'/../public/favicon.svg' => public_path('favicon.svg'),
            __DIR__.'/../public/favicon.ico' => public_path('favicon.ico'),
            __DIR__.'/../public/apple-touch-icon.png' => public_path('apple-touch-icon.png'),
        ], 'larareact-assets');

        $this->publishes([
            __DIR__.'/../app/Providers/FortifyServiceProvider.php' => app_path('Providers/FortifyServiceProvider.php'),
            __DIR__.'/../app/Http/Middleware/HandleAppearance.php' => app_path('Http/Middleware/HandleAppearance.php'),
            __DIR__.'/../app/Http/Middleware/HandleInertiaRequests.php' => app_path('Http/Middleware/HandleInertiaRequests.php'),
            __DIR__.'/../app/Http/Controllers/Settings' => app_path('Http/Controllers/Settings'),
            __DIR__.'/../app/Http/Controllers/Admin' => app_path('Http/Controllers/Admin'),
            __DIR__.'/../app/Models' => app_path('Models'),
            __DIR__.'/../app/Http/Requests' => app_path('Http/Requests'),
            __DIR__.'/../app/Actions/Fortify' => app_path('Actions/Fortify'),
            __DIR__.'/../app/Concerns' => app_path('Concerns'),
            __DIR__.'/../database/migrations' => database_path('migrations'),
            __DIR__.'/../database/seeders' => database_path('seeders'),
            __DIR__.'/../database/factories' => database_path('factories'),
            __DIR__.'/../lang/es.json' => base_path('lang/es.json'),
            __DIR__.'/../lang/en.json' => base_path('lang/en.json'),
            __DIR__.'/../routes/web.php' => base_path('routes/larareact.php'),
            __DIR__.'/../routes/larareact-settings.php' => base_path('routes/larareact-settings.php'),
            __DIR__.'/../routes/admin.php' => base_path('routes/admin.php'),
            __DIR__.'/../routes/modules' => base_path('routes/modules'),
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
        if (class_exists(Fortify::class)) {
            $this->app->bindIf(LoginViewResponse::class, fn () => new class implements LoginViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(RegisterViewResponse::class, fn () => new class implements RegisterViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(ResetPasswordViewResponse::class, fn () => new class implements ResetPasswordViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(RequestPasswordResetLinkViewResponse::class, fn () => new class implements RequestPasswordResetLinkViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(VerifyEmailViewResponse::class, fn () => new class implements VerifyEmailViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(TwoFactorChallengeViewResponse::class, fn () => new class implements TwoFactorChallengeViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
            $this->app->bindIf(ConfirmPasswordViewResponse::class, fn () => new class implements ConfirmPasswordViewResponse
            {
                public function toResponse($request)
                {
                    return response('Please run php artisan larareact:install to complete the setup.', 503);
                }
            });
        }
    }
}
