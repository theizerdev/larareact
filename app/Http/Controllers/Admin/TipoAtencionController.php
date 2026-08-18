<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TipoAtencion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TipoAtencionController extends Controller
{
    /**
     * Muestra el listado de tipos de atención y modalidades de consulta.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = TipoAtencion::query();

        // Filtro de búsqueda general
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('codigo', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        // Filtro por Modalidad (presencial, telemedicina, domicilio, etc.)
        if ($modalidad = $request->input('modalidad')) {
            $query->where('modalidad', $modalidad);
        }

        // Filtro por Tipo de Cita / Consulta (primera_vez, subsecuente, control, etc.)
        if ($tipoConsulta = $request->input('tipo_consulta')) {
            $query->where('tipo_consulta', $tipoConsulta);
        }

        // Filtro por Estado
        if ($request->has('status') && $request->input('status') !== '') {
            $query->where('status', (bool) $request->input('status'));
        }

        $perPage = (int) $request->input('perPage', $request->input('per_page', 10));

        $tiposAtencion = $query->orderBy('nombre', 'asc')
            ->paginate($perPage)
            ->withQueryString();

        // Estadísticas generales para StatCards
        $stats = [
            'total' => TipoAtencion::count(),
            'activos' => TipoAtencion::where('status', true)->count(),
            'primera_vez' => TipoAtencion::where('es_primera_vez', true)->count(),
            'subsecuentes' => TipoAtencion::where('es_subsecuente', true)->count(),
            'virtuales' => TipoAtencion::where('requiere_link_virtual', true)->count(),
            'domiciliarios' => TipoAtencion::where('requiere_direccion', true)->count(),
        ];

        return Inertia::render('admin/TiposAtencion/Index', [
            'tiposAtencion' => $tiposAtencion,
            'stats' => $stats,
            'filters' => [
                'search' => $request->input('search', ''),
                'modalidad' => $request->input('modalidad', ''),
                'tipo_consulta' => $request->input('tipo_consulta', ''),
                'status' => $request->input('status', ''),
                'perPage' => (string) $perPage,
            ],
        ]);
    }

    /**
     * Almacena un nuevo tipo de atención en la base de datos.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'codigo' => 'nullable|string|max:50',
            'modalidad' => 'required|string|max:50',
            'tipo_consulta' => 'required|string|max:50',
            'es_primera_vez' => 'boolean',
            'es_subsecuente' => 'boolean',
            'descripcion' => 'nullable|string',
            'icono' => 'required|string|max:50',
            'color' => 'required|string|max:10',
            'duracion_estimada_minutos' => 'required|integer|min:5|max:480',
            'requiere_link_virtual' => 'boolean',
            'requiere_direccion' => 'boolean',
            'costo_adicional_sugerido' => 'nullable|numeric|min:0',
            'permite_reserva_online' => 'boolean',
            'status' => 'boolean',
        ]);

        $validated['empresa_id'] = $user->empresa_id;

        TipoAtencion::create($validated);

        return back()->with('success', 'Tipo de atención registrado con éxito.');
    }

    /**
     * Actualiza el tipo de atención especificado.
     */
    public function update(Request $request, TipoAtencion $tipoAtencion)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:150',
            'codigo' => 'nullable|string|max:50',
            'modalidad' => 'required|string|max:50',
            'tipo_consulta' => 'required|string|max:50',
            'es_primera_vez' => 'boolean',
            'es_subsecuente' => 'boolean',
            'descripcion' => 'nullable|string',
            'icono' => 'required|string|max:50',
            'color' => 'required|string|max:10',
            'duracion_estimada_minutos' => 'required|integer|min:5|max:480',
            'requiere_link_virtual' => 'boolean',
            'requiere_direccion' => 'boolean',
            'costo_adicional_sugerido' => 'nullable|numeric|min:0',
            'permite_reserva_online' => 'boolean',
            'status' => 'boolean',
        ]);

        $tipoAtencion->update($validated);

        return back()->with('success', 'Tipo de atención actualizado con éxito.');
    }

    /**
     * Conmuta el estado del tipo de atención.
     */
    public function toggleStatus(TipoAtencion $tipoAtencion)
    {
        $tipoAtencion->update(['status' => ! $tipoAtencion->status]);

        return back()->with('success', 'Estado del tipo de atención actualizado.');
    }

    /**
     * Elimina el tipo de atención.
     */
    public function destroy(TipoAtencion $tipoAtencion)
    {
        $tipoAtencion->delete();

        return back()->with('success', 'Tipo de atención eliminado con éxito.');
    }
}
