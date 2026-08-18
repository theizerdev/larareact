<?php

namespace App\Http\Controllers;

use App\Models\SolicitudDemo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SolicitudDemoController extends Controller
{
    /**
     * Recibe una solicitud de demostración desde el landing page público.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|min:2|max:150',
            'empresa' => 'required|string|min:2|max:150',
            'correo' => 'required|email|max:150',
            'telefono' => 'required|string|min:8|max:30',
            'sitios_acceso' => 'required|string|max:150',
            'area_interes' => 'required|string|max:150',
            'mensaje' => 'nullable|string|max:2000',
            'acepta_contacto' => 'accepted',
        ]);

        $solicitud = SolicitudDemo::create([
            'nombre' => $data['nombre'],
            'empresa' => $data['empresa'],
            'correo' => $data['correo'],
            'telefono' => $data['telefono'],
            'sitios_acceso' => $data['sitios_acceso'],
            'area_interes' => $data['area_interes'],
            'mensaje' => $data['mensaje'] ?? null,
            'acepta_contacto' => true,
            'locale' => app()->getLocale(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        Log::info('Nueva solicitud de demostración desde el landing page', [
            'id' => $solicitud->id,
            'empresa' => $solicitud->empresa,
            'correo' => $solicitud->correo,
            'area_interes' => $solicitud->area_interes,
        ]);

        return back();
    }
}
