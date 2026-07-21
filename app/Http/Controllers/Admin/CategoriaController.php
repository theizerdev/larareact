<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoriaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Categoria::withCount('modelos');

        if ($search) {
            $query->where('nombre', 'like', "%{$search}%");
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $categorias = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/Equipos/Categorias/Index', [
            'categorias' => $categorias,
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'icono' => 'nullable|string|max:255',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $validated['slug'] = Str::slug($validated['nombre']);

        Categoria::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Category created successfully.'),
        ]);
    }

    public function update(Request $request, Categoria $categoria)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'icono' => 'nullable|string|max:255',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $validated['slug'] = Str::slug($validated['nombre']);

        $categoria->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Category updated successfully.'),
        ]);
    }

    public function destroy(Categoria $categoria)
    {
        $categoria->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Category deleted successfully.'),
        ]);
    }
}
