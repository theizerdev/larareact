<?php

namespace App\Http\Middleware;

use App\Services\Tenancy\TenantManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantSwitchMiddleware
{
    /**
     * Handle an incoming request and dynamically switch database connection to the user's tenant.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $isSuperAdmin = $user->id === 1
                || (method_exists($user, 'hasRole') && ($user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Super Admin')));

            $targetTenantId = ($isSuperAdmin && $impersonatedTenantId) ? $impersonatedTenantId : $user->empresa_id;

            if ($targetTenantId) {
                if (! TenantManager::databaseExists($targetTenantId)) {
                    TenantManager::provisionTenant($targetTenantId);
                }
                TenantManager::switchTo($targetTenantId);
            }
        }

        return $next($request);
    }
}
