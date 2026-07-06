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
            __DIR__.'/../resources/js' => resource_path('js/larareact'),
        ], 'larareact-assets');

        $this->publishes([
            __DIR__.'/../resources/css' => resource_path('css/larareact'),
        ], 'larareact-css');

        if ($this->app->runningInConsole()) {
            $this->commands([
                InstallCommand::class,
            ]);
        }
    }
}
