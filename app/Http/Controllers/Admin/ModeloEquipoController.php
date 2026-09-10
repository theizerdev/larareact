<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marca;
use App\Models\ModeloEquipo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ModeloEquipoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $marcaId = $request->input('marca_id');
        $perPage = $request->input('perPage', 10);

        $query = ModeloEquipo::with('marca')
            ->withCount(['equipos as total_equipos', 'equipos as disponibles_equipos' => function ($q) {
                $q->where('estado', 'disponible');
            }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('almacenamiento', 'like', "%{$search}%")
                    ->orWhere('ram', 'like', "%{$search}%")
                    ->orWhereHas('marca', function ($m) use ($search) {
                        $m->where('nombre', 'like', "%{$search}%");
                    });
            });
        }

        if ($marcaId) {
            $query->where('marca_id', $marcaId);
        }

        $modelos = $query->orderBy('nombre')->paginate($perPage)->withQueryString();

        $stats = [
            'total' => ModeloEquipo::count(),
            'activos' => ModeloEquipo::where('activo', true)->count(),
        ];

        $marcas = Marca::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);

        return inertia('admin/Modelos/Index', [
            'modelos' => $modelos,
            'stats' => $stats,
            'marcas' => $marcas,
            'filters' => $request->only(['search', 'marca_id', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'nombre' => 'required|string|max:100',
            'almacenamiento' => 'nullable|string|max:50',
            'ram' => 'nullable|string|max:50',
            'procesador' => 'nullable|string|max:100',
            'pantalla' => 'nullable|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        try {
            ModeloEquipo::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Modelo de teléfono registrado con éxito.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al crear modelo: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al registrar el modelo de teléfono.'),
            ]);
        }
    }

    public function update(Request $request, ModeloEquipo $modelo)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'nombre' => 'required|string|max:100',
            'almacenamiento' => 'nullable|string|max:50',
            'ram' => 'nullable|string|max:50',
            'procesador' => 'nullable|string|max:100',
            'pantalla' => 'nullable|string|max:100',
            'bateria' => 'nullable|string|max:100',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ]);

        try {
            $modelo->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Modelo actualizado correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar modelo {$modelo->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al actualizar el modelo.'),
            ]);
        }
    }

    public function toggleStatus(ModeloEquipo $modelo)
    {
        try {
            $modelo->activo = !$modelo->activo;
            $modelo->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Estado del modelo actualizado.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado del modelo {$modelo->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al cambiar estado del modelo.'),
            ]);
        }
    }

    public function destroy(ModeloEquipo $modelo)
    {
        if ($modelo->equipos()->exists()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se puede eliminar un modelo que tiene equipos asociados en inventario.'),
            ]);
        }

        try {
            $modelo->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Modelo eliminado.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar modelo {$modelo->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al eliminar el modelo.'),
            ]);
        }
    }
}
