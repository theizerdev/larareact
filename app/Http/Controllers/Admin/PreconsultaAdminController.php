<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\Especialidad;
use App\Models\PlantillaPreconsulta;
use App\Models\TipoAtencion;
use App\Services\PreconsultaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PreconsultaAdminController extends Controller
{
    protected PreconsultaService $preconsultaService;

    public function __construct(PreconsultaService $preconsultaService)
    {
        $this->preconsultaService = $preconsultaService;
    }

    /**
     * Listado de plantillas de preconsulta.
     */
    public function index(Request $request)
    {
        $plantillas = PlantillaPreconsulta::with(['especialidad', 'tipoAtencion'])
            ->orderBy('created_at', 'desc')
            ->get();

        $especialidades = Especialidad::all();
        $tiposAtencion = TipoAtencion::all();

        return Inertia::render('admin/Preconsultas/Index', [
            'plantillas' => $plantillas,
            'especialidades' => $especialidades,
            'tiposAtencion' => $tiposAtencion,
            'selectedEspecialidadId' => $request->query('especialidad_id'),
        ]);
    }

    /**
     * Crear una nueva plantilla.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'especialidad_id' => 'nullable|exists:especialidades,id',
            'tipo_atencion_id' => 'nullable|exists:tipos_atencion,id',
            'preguntas' => 'required|array|min:1',
            'is_active' => 'boolean',
        ]);

        PlantillaPreconsulta::create($validated);

        return back()->with('success', 'Plantilla de pre-consulta creada exitosamente.');
    }

    /**
     * Actualizar plantilla.
     */
    public function update(Request $request, PlantillaPreconsulta $plantilla)
    {
        $validated = $request->validate([
            'titulo' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'especialidad_id' => 'nullable|exists:especialidades,id',
            'tipo_atencion_id' => 'nullable|exists:tipos_atencion,id',
            'preguntas' => 'required|array|min:1',
            'is_active' => 'boolean',
        ]);

        $plantilla->update($validated);

        return back()->with('success', 'Plantilla de pre-consulta actualizada.');
    }

    /**
     * Eliminar plantilla.
     */
    public function destroy(PlantillaPreconsulta $plantilla)
    {
        $plantilla->delete();
        return back()->with('success', 'Plantilla de pre-consulta eliminada.');
    }

    /**
     * Generar o recuperar enlace único de preconsulta para una cita específica.
     */
    public function generarLinkCita(Cita $cita)
    {
        $preconsulta = $this->preconsultaService->obtenerOGenerarPreconsulta($cita);

        $url = url('/preconsulta/' . $preconsulta->token);

        return response()->json([
            'token' => $preconsulta->token,
            'url' => $url,
            'completado' => $preconsulta->completado,
            'respuestas' => $preconsulta->respuestas,
        ]);
    }
}
