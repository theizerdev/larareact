<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * El auto-registro de Fortify crea cuentas sin empresa ni rol. En esta
 * instancia las cuentas las crea un administrador, así que /register responde
 * 404 salvo que se active explícitamente (auth.allow_public_registration).
 *
 * Se bloquea en tiempo de ejecución (y no quitando la feature de Fortify)
 * porque el frontend importa las rutas generadas `register`/`register.store`.
 */
class DenyPublicRegistration
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->routeIs('register', 'register.store') && ! config('auth.allow_public_registration', false)) {
            abort(404);
        }

        return $next($request);
    }
}
