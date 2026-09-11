<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantSwitchMiddleware
{
    /**
     * Handle an incoming request.
     * En modalidad de base de datos única, las peticiones operan sobre la base principal y el contexto se aísla mediante empresa_id.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }
}

