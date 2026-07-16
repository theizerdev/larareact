<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MarcaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);
        $sortBy = $request->input('sortBy');
        $sortDir = $request->input('sortDir', 'asc');

        $query = Marca::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('sitio_web', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('activo', $status);
        }

        $allowedSortColumns = ['nombre', 'slug', 'sitio_web', 'activo'];
        if ($sortBy && in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('nombre', 'asc');
        }

        $marcas = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Marca::count(),
            'activos' => Marca::where('activo', true)->count(),
            'inactivos' => Marca::where('activo', false)->count(),
        ];

        return inertia('admin/Marcas/Index', [
            'marcas' => $marcas,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'perPage', 'sortBy', 'sortDir']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:marcas,nombre',
            'slug' => 'required|string|max:255|unique:marcas,slug',
            'descripcion' => 'nullable|string',
            'sitio_web' => 'nullable|url|max:255',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            if ($request->hasFile('imagen')) {
                $path = $request->file('imagen')->store('marcas', 'public');
                $validated['imagen'] = '/storage/' . $path;
            }

            Marca::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Brand created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear marca: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the brand. Please try again.'),
            ]);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Marca $marca)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:marcas,nombre,' . $marca->id,
            'slug' => 'required|string|max:255|unique:marcas,slug,' . $marca->id,
            'descripcion' => 'nullable|string',
            'sitio_web' => 'nullable|url|max:255',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            if ($request->hasFile('imagen')) {
                // Borrar imagen anterior si existía
                if ($marca->imagen) {
                    $oldPath = str_replace('/storage/', '', $marca->imagen);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file('imagen')->store('marcas', 'public');
                $validated['imagen'] = '/storage/' . $path;
            }

            $marca->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Brand updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar marca {$marca->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the brand. Please try again.'),
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Marca $marca)
    {
        try {
            if ($marca->imagen) {
                $oldPath = str_replace('/storage/', '', $marca->imagen);
                Storage::disk('public')->delete($oldPath);
            }

            $marca->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Brand deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar marca {$marca->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the brand. Please try again.'),
            ]);
        }
    }

    /**
     * Remove multiple resources from storage.
     */
    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);

        try {
            $marcas = Marca::whereIn('id', $ids)->get();
            foreach ($marcas as $marca) {
                if ($marca->imagen) {
                    $oldPath = str_replace('/storage/', '', $marca->imagen);
                    Storage::disk('public')->delete($oldPath);
                }
                $marca->delete();
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Brands deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error en eliminación masiva de marcas: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the selected brands. Please try again.'),
            ]);
        }
    }
}
