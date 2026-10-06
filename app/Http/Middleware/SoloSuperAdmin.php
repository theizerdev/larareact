<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Módulos de la plataforma completa (monitoreo de servidor, base de datos,
 * logs, sesiones, actividad, colas): no se pueden partir por empresa, así que
 * sólo los usa el Super Administrador.
 */
class SoloSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        return $next($request);
    }
}
