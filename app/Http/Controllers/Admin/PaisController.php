<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pais;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaisController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);
        $sortBy = $request->input('sortBy');
        $sortDir = $request->input('sortDir', 'asc');

        $query = Pais::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo_iso2', 'like', "%{$search}%")
                  ->orWhere('codigo_iso3', 'like', "%{$search}%")
                  ->orWhere('moneda_principal', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('activo', $status);
        }

        // Aplicamos ordenamiento dinámico seguro
        $allowedSortColumns = ['nombre', 'codigo_iso2', 'codigo_iso3', 'activo'];
        if ($sortBy && in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('nombre', 'asc'); // Orden por defecto
        }

        $paises = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Pais::count(),
            'activos' => Pais::where('activo', true)->count(),
            'inactivos' => Pais::where('activo', false)->count(),
        ];

        return inertia('admin/Paises/Index', [
            'paises' => $paises,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'perPage', 'sortBy', 'sortDir']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2',
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3',
            'codigo_telefonico' => 'nullable|string|max:10',
            'moneda_principal' => 'nullable|string|max:3',
            'idioma_principal' => 'nullable|string|max:5',
            'continente' => 'nullable|string|max:50',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:50',
            'formato_fecha' => 'nullable|string|max:20',
            'formato_moneda' => 'nullable|string|max:20',
            'impuesto_predeterminado' => 'nullable|numeric|min:0',
            'separador_miles' => 'nullable|string|max:1',
            'separador_decimales' => 'nullable|string|max:1',
            'decimales_moneda' => 'nullable|integer|min:0',
            'activo' => 'boolean',
        ]);

        Pais::create($validated);

        return back();
    }

    public function update(Request $request, Pais $pais)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo_iso2' => 'required|string|max:2|unique:pais,codigo_iso2,' . $pais->id,
            'codigo_iso3' => 'required|string|max:3|unique:pais,codigo_iso3,' . $pais->id,
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'activo' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($pais, $validated) {
                $pais->update($validated);
            });

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Country updated successfully.')
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar el país {$pais->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the country. Please try again.')
            ]);
        }
    }

    public function toggleStatus(Pais $pais)
    {
        $pais->activo = !$pais->activo;
        $pais->save();

        return back();
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:pais,id',
        ]);

        DB::beginTransaction();

        try {
            Pais::destroy($validated['ids']);

            DB::commit();

            $message = count($validated['ids']) > 1
                ? __('Selected countries have been deleted successfully.')
                : __('Selected country has been deleted successfully.');

            return back()->with('notification', [
                'type' => 'success',
                'message' => $message
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error en la eliminación masiva de países: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => 'Hubo un error al intentar eliminar los países. Por favor, inténtelo de nuevo.'
            ]);
        }
    }
}