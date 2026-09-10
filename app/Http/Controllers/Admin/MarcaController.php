<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MarcaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $perPage = $request->input('perPage', 10);

        $query = Marca::withCount('modelos');

        if ($search) {
            $query->where('nombre', 'like', "%{$search}%");
        }

        $marcas = $query->orderBy('nombre')->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Marca::count(),
            'activas' => Marca::where('activo', true)->count(),
        ];

        return inertia('admin/Marcas/Index', [
            'marcas' => $marcas,
            'stats' => $stats,
            'filters' => $request->only(['search', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre',
            'activo' => 'boolean',
        ]);

        try {
            Marca::create([
                'nombre' => $validated['nombre'],
                'slug' => Str::slug($validated['nombre']),
                'activo' => $validated['activo'] ?? true,
            ]);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Marca creada exitosamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al crear marca: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al crear la marca.'),
            ]);
        }
    }

    public function update(Request $request, Marca $marca)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:marcas,nombre,' . $marca->id,
            'activo' => 'boolean',
        ]);

        try {
            $marca->update([
                'nombre' => $validated['nombre'],
                'slug' => Str::slug($validated['nombre']),
                'activo' => $validated['activo'] ?? true,
            ]);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Marca actualizada correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar marca {$marca->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al actualizar la marca.'),
            ]);
        }
    }

    public function toggleStatus(Marca $marca)
    {
        try {
            $marca->activo = !$marca->activo;
            $marca->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Estado de la marca actualizado.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de marca {$marca->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al cambiar estado de la marca.'),
            ]);
        }
    }

    public function destroy(Marca $marca)
    {
        if ($marca->modelos()->exists()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se puede eliminar una marca con modelos registrados.'),
            ]);
        }

        try {
            $marca->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Marca eliminada.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar marca {$marca->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al eliminar la marca.'),
            ]);
        }
    }
}

