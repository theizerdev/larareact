<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordNotExpired
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isPasswordExpired()) {
            if ($request->routeIs('password.expired', 'password.expired.update', 'logout', 'locale.*')) {
                return $next($request);
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Su contraseña ha superado la vigencia de 90 días por política de seguridad SOX. Debe actualizarla para continuar.',
                    'password_expired' => true,
                    'redirect_url' => route('password.expired'),
                ], 403);
            }

            return redirect()->route('password.expired')
                ->with('warning', 'Su contraseña ha superado el periodo de vigencia por política de seguridad SOX. Debe actualizarla para continuar.');
        }

        return $next($request);
    }
}
