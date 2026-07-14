<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\CargoRequest;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CargoController extends Controller
{
    public function index(Request $request)
    {
        $query = Cargo::with(['empresa', 'sucursal', 'user', 'departamento'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%");
                });
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('departamento_id')) {
            $query->where('departamento_id', (int) $request->departamento_id);
        }

        $cargos = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total' => Cargo::count(),
            'activos' => Cargo::where('status', 1)->count(),
            'inactivos' => Cargo::where('status', 0)->count(),
        ];

        return Inertia::render('admin/Cargos/Index', [
            'cargos' => $cargos,
            'stats' => $stats,
            'empresas' => Empresa::where('status', true)->orderBy('razon_social', 'asc')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id']),
            'departamentos' => Departamento::where('status', true)->orderBy('nombre', 'asc')->get(['id', 'nombre', 'empresa_id', 'sucursal_id']),
            'usuarios' => \App\Models\User::orderBy('name', 'asc')->get(['id', 'name', 'email']),
            'filters' => $request->only('search', 'status', 'perPage', 'departamento_id'),
        ]);
    }

    public function store(CargoRequest $request)
    {
        Cargo::create($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Position created successfully.'),
        ]);
    }

    public function update(CargoRequest $request, Cargo $cargo)
    {
        $cargo->update($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Position updated successfully.'),
        ]);
    }

    public function toggleStatus(Cargo $cargo)
    {
        $cargo->update(['status' => $cargo->status ? 0 : 1]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(Cargo $cargo)
    {
        $cargo->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Position deleted successfully.'),
        ]);
    }
}
