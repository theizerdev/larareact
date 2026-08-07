<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoriaRequest;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoriaController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';
        $empresa = $user->empresa ?? ($user->empresa_id ? \App\Models\Empresa::find($user->empresa_id) : null);
        if ($empresa && $empresa->pais_id) {
            $pais = \App\Models\Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }
        return '$';
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Categoria::with([
            'modelos:id,nombre_comercial,codigo_modelo,marca_id,categoria_id',
            'modelos.marca:id,nombre',
            'servicios:id,categoria_id,nombre,codigo,precio,estado',
        ])->withCount(['modelos', 'servicios']);

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
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function store(CategoriaRequest $request)
    {
        $validated = $request->validated();

        $validated['slug'] = Str::slug($validated['nombre']);

        Categoria::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Category created successfully.'),
        ]);
    }

    public function update(CategoriaRequest $request, Categoria $categoria)
    {
        $validated = $request->validated();

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
