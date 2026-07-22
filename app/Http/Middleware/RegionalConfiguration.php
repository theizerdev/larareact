<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\RegionalConfigurationService;
use App\Services\ExchangeRateService;

class RegionalConfiguration
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {

    
        // Aplicar la configuración regional del sistema (empresa/país del usuario o por defecto)
        RegionalConfigurationService::setRegionalConfiguration();

        return $next($request);
    }
}
