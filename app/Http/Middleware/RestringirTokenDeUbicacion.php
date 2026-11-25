<?php

namespace App\Http\Middleware;

use App\Services\UbicacionJornadaService;
use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

/**
 * El token de ubicación (UbicacionJornadaService::TOKEN) sólo sirve para
 * mandar la ubicación de la jornada. La app lo conserva en el teléfono
 * después de cerrar la sesión, así que no debe abrir nada más de la API.
 */
class RestringirTokenDeUbicacion
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->user()?->currentAccessToken();

        if ($token instanceof PersonalAccessToken
            && ! $token->can('*')
            && ! $request->routeIs('api.ubicaciones.*')) {
            return response()->json([
                'success' => false,
                'message' => 'Este token sólo permite enviar la ubicación de la jornada.',
            ], 403);
        }

        return $next($request);
    }
}
