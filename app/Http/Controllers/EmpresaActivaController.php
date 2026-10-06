<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EmpresaActiva;
use App\Models\Empresa;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class EmpresaActivaController extends Controller
{
    /**
     * Liga de acceso de una empresa (/e/{slug}): el navegador recuerda la
     * empresa y el login muestra su logo.
     */
    public function acceso(Request $request, string $slug): RedirectResponse
    {
        $empresa = Empresa::withoutTenant()->where('slug', $slug)->where('status', true)->firstOrFail();

        Cookie::queue(EmpresaActiva::COOKIE, $empresa->slug, 60 * 24 * 365);

        return redirect()->route($request->user() ? 'dashboard' : 'login');
    }

    /**
     * Selector del Super Administrador: entra a una empresa o vuelve a la
     * vista de todas (empresa_id vacío).
     */
    public function cambiar(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isSuperAdmin(), 403);

        $validated = $request->validate([
            'empresa_id' => ['nullable', 'integer', 'exists:empresas,id'],
        ]);

        if ($validated['empresa_id'] ?? null) {
            $request->session()->put(EmpresaActiva::SESSION_KEY, (int) $validated['empresa_id']);
        } else {
            $request->session()->forget(EmpresaActiva::SESSION_KEY);
        }

        return redirect()->route('dashboard');
    }
}
