<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Corta con 404 las rutas de un módulo apagado en config/modulos.php.
 *
 * Es 404 y no 403 a propósito: para quien no tiene el módulo contratado la
 * ruta no existe, y no conviene confirmarle que está ahí.
 */
class ModuloHabilitado
{
    public function handle(Request $request, Closure $next, string $modulo): Response
    {
        abort_unless(self::activo($modulo), 404);

        return $next($request);
    }

    public static function activo(string $modulo): bool
    {
        return (bool) config("modulos.{$modulo}", false);
    }
}
