<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTenantContext
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        // Si el usuario es SuperAdmin, tiene acceso global
        $isSuperAdmin = method_exists($user, 'isSuperAdmin')
            ? $user->isSuperAdmin()
            : (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['Super Administrador', 'super-admin', 'Super Admin', 'super_admin']));

        if ($isSuperAdmin) {
            return $next($request);
        }

        // Verificar que el usuario tenga una empresa asignada y activa
        if (! $user->empresa_id || ! $user->empresa || ! $user->empresa->status) {
            abort(403, 'Acceso denegado: Tu cuenta no está asociada a una clínica o empresa activa.');
        }

        // Adjuntar el tenant activo al request para facilitar su consumo en controladores
        $request->attributes->set('tenant', $user->empresa);

        return $next($request);
    }
}
