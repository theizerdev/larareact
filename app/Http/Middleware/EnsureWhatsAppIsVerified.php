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

        // No realizar redirección en peticiones JSON, API o AJAX
        if ($request->expectsJson() || $request->wantsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return $next($request);
        }

        // Si hay un usuario autenticado y tiene teléfono pero no ha sido verificado aún por WhatsApp
        if ($user && ! empty($user->telefono) && ! $user->whatsapp_verified_at) {
            // Permitir el acceso solo a las rutas de verificación de whatsapp y logout
            if (! $request->is('verify-whatsapp*') && ! $request->is('logout')) {
                return redirect()->route('verify-whatsapp.index');
            }
        }

        // 2. Redirección obligatoria para Administradores mientras WhatsApp no esté conectado
        if ($user->empresa_id) {
            setPermissionsTeamId($user->empresa_id);
        }

        $isAdmin = $user->id === 1
            || $user->hasRole('Administrador')
            || $user->hasRole('Super Administrador')
            || $user->hasRole('super-admin')
            || \Illuminate\Support\Facades\DB::table('model_has_roles')
                ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                ->where('model_has_roles.model_id', $user->id)
                ->whereIn('roles.name', ['Administrador', 'Super Administrador', 'super-admin', 'Admin'])
                ->exists();

        if ($isAdmin) {
            $empresa = $user->empresa ?? ($user->empresa_id ? \App\Models\Empresa::find($user->empresa_id) : null);
            if ($empresa && (bool) $empresa->whatsapp_active && $empresa->whatsapp_status !== 'connected') {
                if (! $request->is('admin/integrations/whatsapp*') && ! $request->is('verify-whatsapp*') && ! $request->is('logout')) {
                    session()->flash('notification', [
                        'type' => 'info',
                        'message' => __('Atención: Debe vincular su cuenta de WhatsApp para comenzar a utilizar la plataforma.'),
                    ]);

                    return redirect()->route('admin.integrations.whatsapp.index');
                }
            }
        }

        return $next($request);
    }
}
