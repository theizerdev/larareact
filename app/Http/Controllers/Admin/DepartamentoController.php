<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartamentoRequest;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DepartamentoController extends Controller
{
    public function index(Request $request)
    {
        $query = Departamento::with(['empresa', 'sucursal', 'user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%")
                        ->orWhere('codigo', 'like', "%{$search}%")
                        ->orWhere('responsable', 'like', "%{$search}%");
                });
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $departamentos = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Departamento::count(),
            'activos' => Departamento::where('status', 1)->count(),
            'inactivos' => Departamento::where('status', 0)->count(),
        ];

        $user = $request->user();
        $empresa = Empresa::find($user->empresa_id) ?: Empresa::first();
        $sucursal = Sucursal::find($user->sucursal_id);

        return Inertia::render('admin/Departamentos/Index', [
            'departamentos' => $departamentos,
            'stats' => $stats,
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id', 'latitud', 'longitud']),
            'usuarios' => \App\Models\User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'filters' => $request->only('search', 'status', 'perPage'),
            'empresa' => $empresa ? [
                'id' => $empresa->id,
                'latitud' => $empresa->latitud,
                'longitud' => $empresa->longitud,
                'mapbox_api_key' => $empresa->mapbox_api_key,
                'mapbox_active' => (bool) $empresa->mapbox_active,
            ] : null,
            'sucursal' => $sucursal ? [
                'id' => $sucursal->id,
                'latitud' => $sucursal->latitud,
                'longitud' => $sucursal->longitud,
            ] : null,
        ]);
    }

    public function store(DepartamentoRequest $request)
    {
        Departamento::create($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Department created successfully.'),
        ]);
    }

    public function update(DepartamentoRequest $request, Departamento $departamento)
    {
        $departamento->update($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Department updated successfully.'),
        ]);
    }

    public function toggleStatus(Departamento $departamento)
    {
        $departamento->update(['status' => $departamento->status ? 0 : 1]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(Departamento $departamento)
    {
        $departamento->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Department deleted successfully.'),
        ]);
    }
}
