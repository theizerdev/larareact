<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\MarcaRequest;
use App\Models\Marca;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MarcaController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Marca::withCount(['familias', 'modelos']);

        if ($search) {
            $query->where('nombre', 'like', "%{$search}%");
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $marcas = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        return inertia('admin/Equipos/Marcas/Index', [
            'marcas' => $marcas,
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function store(MarcaRequest $request)
    {
        $validated = $request->validated();

        $validated['slug'] = Str::slug($validated['nombre']);

        Marca::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Brand created successfully.'),
        ]);
    }

    public function update(MarcaRequest $request, Marca $marca)
    {
        $validated = $request->validated();

        $validated['slug'] = Str::slug($validated['nombre']);

        $marca->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Brand updated successfully.'),
        ]);
    }

    public function destroy(Marca $marca)
    {
        $marca->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Brand deleted successfully.'),
        ]);
    }
}
