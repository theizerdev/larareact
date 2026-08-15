<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscriptionStatus
{
    /**
     * Rutas exentas del bloqueo por suscripción vencida.
     */
    protected array $exceptRoutes = [
        'admin.subscription.expired',
        'admin.subscription.index',
        'admin.subscription.renew',
        'admin.subscription.manage',
        'admin.subscription.approve',
        'admin.subscription.reject',
        'admin.subscription.paypal.create-order',
        'admin.subscription.paypal.capture-order',
        'logout',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Si no hay usuario autenticado, dejamos pasar al middleware auth
        if (! auth()->check()) {
            return $next($request);
        }

        $user = auth()->user();
        $empresa = $user->empresa;

        // 2. Si no tiene empresa o es la Empresa ID 1 (SaaS Owner) -> Acceso total ilimitado
        if (! $empresa || $empresa->isExemptFromSubscription()) {
            return $next($request);
        }

        // 3. Si la ruta actual es una ruta exenta (pantalla de bloqueo, renovación, logout) -> Permitir
        $currentRoute = $request->route()?->getName();
        if ($currentRoute && in_array($currentRoute, $this->exceptRoutes)) {
            return $next($request);
        }

        // También verificar por sufijos o prefijos de suscripción
        if ($request->is('subscription/*') || $request->is('admin/subscription/*') || $request->is('admin/monitoring/subscription*') || $request->is('logout')) {
            return $next($request);
        }

        // 4. Verificar si la empresa tiene suscripción o prueba activa
        if (! $empresa->hasActiveSubscription()) {
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'error' => 'Suscripción Vencida',
                    'message' => 'El período de prueba o suscripción de su empresa ha caducado.',
                    'redirect' => route('admin.subscription.index'),
                ], Response::HTTP_PAYMENT_REQUIRED);
            }

            return redirect()->route('admin.subscription.index');
        }

        return $next($request);
    }
}
