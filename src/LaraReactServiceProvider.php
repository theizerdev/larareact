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
            ]);
        }
    }
}
