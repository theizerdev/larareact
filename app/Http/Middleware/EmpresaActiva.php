<?php

namespace App\Http\Middleware;

use App\Models\Empresa;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

/**
 * Aísla cada petición en una sola empresa.
 *
 * - Super Administrador: si eligió una empresa en el selector del panel
 *   (sesión "empresa_activa_id"), se le presta en memoria y todo lo que hace
 *   queda limitado a ella. Sin elección ve todas, como siempre.
 * - Usuario normal sin empresa asignada: no puede usar el panel.
 * - Usuario normal: el navegador recuerda su empresa para que el login
 *   muestre su logo la próxima vez.
 */
class EmpresaActiva
{
    public const SESSION_KEY = 'empresa_activa_id';

    public const COOKIE = 'hosho_empresa';

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->isSuperAdmin()) {
            $id = $request->session()->get(self::SESSION_KEY);
            $empresa = $id ? Empresa::withoutTenant()->find($id) : null;

            if ($empresa) {
                $user->entrarAEmpresa($empresa);
            } elseif ($id) {
                $request->session()->forget(self::SESSION_KEY);
            }

            return $next($request);
        }

        if (! $user->empresa_id) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->with('status', __('Your user has no company assigned. Contact your administrator.'));
        }

        $slug = $user->empresa?->slug;
        if ($slug && $request->cookie(self::COOKIE) !== $slug) {
            Cookie::queue(self::COOKIE, $slug, 60 * 24 * 365);
        }

        return $next($request);
    }
}
