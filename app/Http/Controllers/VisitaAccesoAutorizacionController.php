<?php

namespace App\Http\Controllers;

use App\Models\VisitaAccesoAutorizacion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VisitaAccesoAutorizacionController extends Controller
{
    /**
     * Mostrar la pantalla pública para que el Responsable revise y autorice el acceso.
     */
    public function show(string $token)
    {
        $autorizacion = VisitaAccesoAutorizacion::with(['responsable', 'empleado.departamento', 'empleado.cargo', 'empresa'])
            ->where('token', $token)
            ->firstOrFail();

        return Inertia::render('Public/AutorizarAcceso', [
            'autorizacion' => [
                'id'                  => $autorizacion->id,
                'token'               => $autorizacion->token,
                'status'              => $autorizacion->status,
                'motivo_autorizacion' => $autorizacion->motivo_autorizacion,
                'autorizado_at'       => $autorizacion->autorizado_at ? $autorizacion->autorizado_at->format('d/m/Y H:i') : null,
                'responsable'         => $autorizacion->responsable ? [
                    'nombre' => $autorizacion->responsable->nombre_completo,
                    'correo' => $autorizacion->responsable->correo,
                ] : null,
                'empleado'            => $autorizacion->empleado ? [
                    'nombres'             => $autorizacion->empleado->nombres,
                    'apellidos'           => $autorizacion->empleado->apellidos,
                    'documento_identidad' => $autorizacion->empleado->documento_identidad,
                    'foto_empleado'       => $autorizacion->empleado->foto_empleado,
                    'departamento'        => $autorizacion->empleado->departamento?->nombre,
                    'cargo'               => $autorizacion->empleado->cargo?->nombre,
                    'jornada_laboral'     => $autorizacion->empleado->jornada_laboral,
                ] : null,
                'datos_solicitud'     => $autorizacion->datos_solicitud,
                'empresa'             => $autorizacion->empresa ? [
                    'razon_social' => $autorizacion->empresa->razon_social,
                    'logo'         => $autorizacion->empresa->logo,
                ] : null,
            ],
        ]);
    }

    /**
     * Procesar la respuesta del Responsable (Autorizar o Rechazar).
     */
    public function autorizar(Request $request, string $token)
    {
        $autorizacion = VisitaAccesoAutorizacion::where('token', $token)->firstOrFail();

        if ($autorizacion->status !== 'pendiente') {
            return redirect()->back()->with('error', 'Esta solicitud ya ha sido procesada previamente.');
        }

        $request->validate([
            'accion'              => 'required|in:autorizar,rechazar',
            'motivo_autorizacion' => 'required|string|min:3|max:1000',
        ]);

        $status = $request->accion === 'autorizar' ? 'autorizado' : 'rechazado';

        $autorizacion->update([
            'status'              => $status,
            'motivo_autorizacion' => $request->motivo_autorizacion,
            'autorizado_at'       => now(),
        ]);

        return redirect()->back()->with('success', $status === 'autorizado' ? 'Acceso autorizado exitosamente.' : 'Acceso rechazado.');
    }

    /**
     * Endpoint API para que la garita consulte si el responsable ya respondió.
     */
    public function checkStatus(string $token)
    {
        $autorizacion = VisitaAccesoAutorizacion::with('responsable')->where('token', $token)->first();

        if (!$autorizacion) {
            return response()->json(['found' => false]);
        }

        return response()->json([
            'found'               => true,
            'status'              => $autorizacion->status,
            'motivo_autorizacion' => $autorizacion->motivo_autorizacion,
            'responsable_nombre' => $autorizacion->responsable?->nombre_completo,
            'autorizado_at'       => $autorizacion->autorizado_at ? $autorizacion->autorizado_at->format('H:i:s') : null,
        ]);
    }
}
