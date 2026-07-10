<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Empresa;

class IntegrationController extends Controller
{
    /**
     * Muestra el panel de integraciones para la empresa del usuario.
     */
    public function index(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (!$empresa) {
            return redirect()->route('admin.dashboard')->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        return inertia('admin/integrations/index', [
            'mapbox_api_key' => $empresa->mapbox_api_key,
            'mapbox_active' => (bool)$empresa->mapbox_active,
        ]);
    }

    /**
     * Actualiza la configuración de Mapbox de la empresa del usuario.
     */
    public function updateMapbox(Request $request)
    {
        $empresa = $request->user()->empresa;

        if (!$empresa) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No active company associated with your user.'),
            ]);
        }

        $validated = $request->validate([
            'mapbox_api_key' => 'nullable|string|max:255',
            'mapbox_active' => 'required|boolean',
        ]);

        $empresa->update([
            'mapbox_api_key' => $validated['mapbox_api_key'],
            'mapbox_active' => $validated['mapbox_active'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Mapbox integration settings updated successfully.'),
        ]);
    }
}
