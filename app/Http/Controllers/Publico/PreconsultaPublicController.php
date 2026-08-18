<?php

namespace App\Http\Controllers\Publico;

use App\Http\Controllers\Controller;
use App\Models\CitaPreconsulta;
use App\Services\PreconsultaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreconsultaPublicController extends Controller
{
    protected PreconsultaService $preconsultaService;

    public function __construct(PreconsultaService $preconsultaService)
    {
        $this->preconsultaService = $preconsultaService;
    }

    /**
     * Muestra el cuestionario móvil interactivo al paciente.
     */
    public function show($token)
    {
        $preconsulta = CitaPreconsulta::with(['cita.paciente', 'cita.medico', 'cita.especialidad', 'plantilla'])
            ->where('token', $token)
            ->firstOrFail();

        return Inertia::render('public/Preconsulta/Show', [
            'preconsulta' => $preconsulta,
        ]);
    }

    /**
     * Guarda las respuestas enviadas por el paciente.
     */
    public function store(Request $request, $token)
    {
        $preconsulta = CitaPreconsulta::where('token', $token)->firstOrFail();

        $request->validate([
            'respuestas' => 'required|array',
        ]);

        $this->preconsultaService->guardarRespuestas(
            $preconsulta,
            $request->respuestas,
            $request->ip()
        );

        return back()->with('success', '¡Gracias! Tus respuestas han sido guardadas y enviadas al médico tratante.');
    }
}
