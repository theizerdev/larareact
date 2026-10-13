<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cierra la sesión de un usuario que fue desactivado ('inactivo' o
 * 'suspendido') mientras tenía una sesión abierta. Solo bloquea esos dos
 * estados explícitos; cualquier otro valor se trata como activo.
 */
class EnsureUserActive
{
    public const BLOCKED_STATUSES = ['inactivo', 'suspendido'];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && in_array($user->status, self::BLOCKED_STATUSES, true)) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json(['message' => 'Su cuenta se encuentra desactivada.'], 401);
            }

            return redirect()->route('login');
        }

        return $next($request);
    }
}
