<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CategoriaController extends Controller
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

        $query = Categoria::with('parent');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('descripcion', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('activo', $status);
        }

        $allowedSortColumns = ['nombre', 'slug', 'parent_id', 'activo'];
        if ($sortBy && in_array($sortBy, $allowedSortColumns)) {
            $query->orderBy($sortBy, $sortDir === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('nombre', 'asc');
        }

        $categorias = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Categoria::count(),
            'activos' => Categoria::where('activo', true)->count(),
            'inactivos' => Categoria::where('activo', false)->count(),
        ];

        // Todas las categorías para el selector de padre
        $parentCategories = Categoria::orderBy('nombre')->get(['id', 'nombre', 'parent_id']);

        return inertia('admin/Categorias/Index', [
            'categorias' => $categorias,
            'stats' => $stats,
            'parentCategories' => $parentCategories,
            'filters' => $request->only(['search', 'status', 'perPage', 'sortBy', 'sortDir']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:categorias,nombre',
            'slug' => 'required|string|max:255|unique:categorias,slug',
            'parent_id' => 'nullable|exists:categorias,id',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        try {
            if ($request->hasFile('imagen')) {
                $path = $request->file('imagen')->store('categorias', 'public');
                $validated['imagen'] = '/storage/' . $path;
            }

            Categoria::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Category created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear categoría: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the category. Please try again.'),
            ]);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255|unique:categorias,nombre,' . $categoria->id,
            'slug' => 'required|string|max:255|unique:categorias,slug,' . $categoria->id,
            'parent_id' => 'nullable|exists:categorias,id',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
            'imagen' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Evitar que una categoría sea su propio padre
        if (isset($validated['parent_id']) && $validated['parent_id'] == $categoria->id) {
            return back()->withErrors(['parent_id' => __('A category cannot be its own parent.')]);
        }

        try {
            if ($request->hasFile('imagen')) {
                // Borrar imagen anterior si existía
                if ($categoria->imagen) {
                    $oldPath = str_replace('/storage/', '', $categoria->imagen);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file('imagen')->store('categorias', 'public');
                $validated['imagen'] = '/storage/' . $path;
            }

            $categoria->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Category updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar categoría {$categoria->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the category. Please try again.'),
            ]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Categoria $categoria)
    {
        try {
            if ($categoria->imagen) {
                $oldPath = str_replace('/storage/', '', $categoria->imagen);
                Storage::disk('public')->delete($oldPath);
            }

            // Al eliminar, las categorías hijas tendrán su parent_id seteado a null por la FK 'onDelete set null'
            $categoria->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Category deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar categoría {$categoria->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the category. Please try again.'),
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
            $categorias = Categoria::whereIn('id', $ids)->get();
            foreach ($categorias as $categoria) {
                if ($categoria->imagen) {
                    $oldPath = str_replace('/storage/', '', $categoria->imagen);
                    Storage::disk('public')->delete($oldPath);
                }
                $categoria->delete();
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Categories deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error en eliminación masiva de categorías: ' . $e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the selected categories. Please try again.'),
            ]);
        }
    }
}
