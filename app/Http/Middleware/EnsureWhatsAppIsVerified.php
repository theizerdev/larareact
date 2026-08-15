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

        // Redirección automática para Administradores en primer ingreso de sesión si WhatsApp no está vinculado
        if ($user && (! $request->session()->has('whatsapp_first_redirect_done'))) {
            $request->session()->put('whatsapp_first_redirect_done', true);

            $isAdmin = $user->hasRole('Administrador') || $user->hasRole('Super Administrador');
            if ($isAdmin) {
                $empresa = $user->empresa ?? ($user->empresa_id ? \App\Models\Empresa::find($user->empresa_id) : null);
                if ($empresa && $empresa->whatsapp_status !== 'connected') {
                    if (! $request->is('admin/integrations/whatsapp*') && ! $request->is('verify-whatsapp*') && ! $request->is('logout')) {
                        session()->flash('notification', [
                            'type' => 'info',
                            'message' => __('Por favor escanee el código QR para vincular su cuenta de WhatsApp.'),
                        ]);

                        return redirect()->route('admin.integrations.whatsapp.index');
                    }
                }
            }
        }

        return $next($request);
    }
}
