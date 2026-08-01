<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureWhatsAppIsVerified
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Si hay un usuario autenticado y tiene teléfono pero no ha sido verificado aún por WhatsApp
        if ($user && ! empty($user->telefono) && ! $user->whatsapp_verified_at) {
            // Permitir el acceso solo a las rutas de verificación de whatsapp y logout
            if (! $request->is('verify-whatsapp*') && ! $request->is('logout')) {
                return redirect()->route('verify-whatsapp.index');
            }
        }

        return $next($request);
    }
}
