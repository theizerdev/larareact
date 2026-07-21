<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class LaraReactServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__.'/../../config/larareact.php', 'larareact'
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../../resources/views', 'larareact');

        $this->publishes([
            __DIR__.'/../../config/larareact.php' => config_path('larareact.php'),
        ], 'larareact-config');

        $this->publishes([
            __DIR__.'/../../resources/js' => resource_path('js/larareact'),
        ], 'larareact-assets');
    }
}
