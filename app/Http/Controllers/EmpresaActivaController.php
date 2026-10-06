<?php

namespace App\Http\Controllers;

use App\Http\Middleware\EmpresaActiva;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmpresaActivaController extends Controller
{
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
