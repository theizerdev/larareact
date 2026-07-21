<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Familia;
use App\Models\Marca;
use Illuminate\Http\Request;

class FamiliaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $marcaId = $request->input('marca_id');
        $categoriaId = $request->input('categoria_id');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Familia::with(['marca', 'categoria'])->withCount('modelos');

        if ($search) {
            $query->where('nombre', 'like', "%{$search}%");
        }

        if ($marcaId) {
            $query->where('marca_id', $marcaId);
        }

        if ($categoriaId) {
            $query->where('categoria_id', $categoriaId);
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $familias = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/Equipos/Familias/Index', [
            'familias' => $familias,
            'marcas' => Marca::where('estado', true)->orderBy('nombre')->get(['id', 'nombre']),
            'categorias' => Categoria::where('estado', true)->orderBy('nombre')->get(['id', 'nombre']),
            'filters' => $request->only(['search', 'marca_id', 'categoria_id', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'categoria_id' => 'nullable|exists:categorias,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        Familia::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Family created successfully.'),
        ]);
    }

    public function update(Request $request, Familia $familia)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'categoria_id' => 'nullable|exists:categorias,id',
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $familia->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Family updated successfully.'),
        ]);
    }

    public function destroy(Familia $familia)
    {
        $familia->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Family deleted successfully.'),
        ]);
    }
}
