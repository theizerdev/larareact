<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class SetUserTimezone
{
    /**
     * Handle an incoming request.
     *
     * Sincroniza dinámicamente la zona horaria de PHP y la sesión activa de la BD
     * con la zona horaria del país de la empresa del usuario autenticado.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $timezone = $user ? $user->getTimezone() : config('app.timezone', 'America/Mexico_City');

        if (!empty($timezone)) {
            try {
                date_default_timezone_set($timezone);
                config(['app.timezone' => $timezone]);

                // Establecer el huso horario en la sesión de la base de datos con formato numérico (+/-HH:MM)
                $offset = (new \DateTime('now', new \DateTimeZone($timezone)))->format('P');
                DB::statement("SET time_zone = '{$offset}'");
            } catch (\Throwable $e) {
                // Silencioso en caso de zonas inválidas o problemas de conexión
            }
        }

        return $next($request);
    }
}
