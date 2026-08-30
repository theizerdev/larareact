<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Familia;
use App\Models\Marca;
use App\Models\Modelo;
use Illuminate\Http\Request;

class ModeloController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $marcaId = $request->input('marca_id');
        $familiaId = $request->input('familia_id');
        $categoriaId = $request->input('categoria_id');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Modelo::with(['marca', 'familia', 'categoria']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre_comercial', 'like', "%{$search}%")
                  ->orWhere('codigo_modelo', 'like', "%{$search}%");
            });
        }

        if ($marcaId) {
            $query->where('marca_id', $marcaId);
        }

        if ($familiaId) {
            $query->where('familia_id', $familiaId);
        }

        if ($categoriaId) {
            $query->where('categoria_id', $categoriaId);
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $modelos = $query->orderBy('nombre_comercial', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/Equipos/Modelos/Index', [
            'modelos' => $modelos,
            'marcas' => Marca::where('estado', true)->orderBy('nombre')->get(['id', 'nombre'])->unique('id')->values(),
            'familias' => Familia::where('estado', true)->orderBy('nombre')->get(['id', 'nombre', 'marca_id', 'specs_json'])->unique('id')->values(),
            'categorias' => Categoria::where('estado', true)->orderBy('nombre')->get(['id', 'nombre'])->unique('id')->values(),
            'filters' => $request->only(['search', 'marca_id', 'familia_id', 'categoria_id', 'status', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'familia_id' => 'required|exists:familias,id',
            'categoria_id' => 'required|exists:categorias,id',
            'nombre_comercial' => 'required|string|max:255',
            'codigo_modelo' => 'nullable|string|max:255',
            'imagen_url' => 'nullable|string|max:255',
            'specs_overrides' => 'nullable|array',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:landlord.empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $modelo = Modelo::create($validated);
        $modelo->load(['marca', 'familia', 'categoria']);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $modelo->id,
                    'nombre' => $modelo->nombre_comercial . ($modelo->codigo_modelo ? ' (' . $modelo->codigo_modelo . ')' : ''),
                    'nombre_comercial' => $modelo->nombre_comercial,
                    'codigo_modelo' => $modelo->codigo_modelo,
                    'marca_id' => $modelo->marca_id,
                    'familia_id' => $modelo->familia_id,
                    'categoria_id' => $modelo->categoria_id,
                    'marca' => $modelo->marca?->nombre ?? '',
                    'familia' => $modelo->familia?->nombre ?? '',
                    'categoria' => $modelo->categoria?->nombre ?? '',
                    'specs_json' => $modelo->specs_overrides ?? [],
                ],
                'message' => __('Model created successfully.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Model created successfully.'),
        ]);
    }

    public function update(Request $request, Modelo $modelo)
    {
        $validated = $request->validate([
            'marca_id' => 'required|exists:marcas,id',
            'familia_id' => 'required|exists:familias,id',
            'categoria_id' => 'required|exists:categorias,id',
            'nombre_comercial' => 'required|string|max:255',
            'codigo_modelo' => 'nullable|string|max:255',
            'imagen_url' => 'nullable|string|max:255',
            'specs_overrides' => 'nullable|array',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:landlord.empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ]);

        $modelo->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Model updated successfully.'),
        ]);
    }

    public function destroy(Modelo $modelo)
    {
        $modelo->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Model deleted successfully.'),
        ]);
    }
}
