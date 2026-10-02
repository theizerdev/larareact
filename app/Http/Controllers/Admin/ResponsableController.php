<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResponsableRequest;
use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\Pais;
use App\Models\Responsable;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ResponsableController extends Controller
{
    public function index(Request $request)
    {
        $query = Responsable::query()
            ->with(['departamento', 'cargo', 'paisTelefono', 'empresa', 'sucursal', 'user'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%")
                        ->orWhere('correo', 'like', "%{$search}%");
                });
            });

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('departamento_id')) {
            $query->where('departamento_id', (int) $request->departamento_id);
        }

        $responsables = $query->latest()->paginate($request->perPage ?? 10)->withQueryString();

        $stats = [
            'total'     => Responsable::count(),
            'activos'   => Responsable::where('status', 1)->count(),
            'inactivos' => Responsable::where('status', 0)->count(),
        ];

        $paises = Pais::where('activo', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']);

        $departamentos = Departamento::where('status', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'empresa_id', 'sucursal_id']);

        $cargos = Cargo::where('status', 1)
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'departamento_id', 'empresa_id', 'sucursal_id']);

        $empresas = Empresa::where('status', true)
            ->orderBy('razon_social', 'asc')
            ->get(['id', 'razon_social']);

        $sucursales = Sucursal::where('status', true)
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'empresa_id']);

        $usuarios = User::orderBy('name', 'asc')
            ->get(['id', 'name', 'email']);

        return Inertia::render('admin/Responsables/Index', [
            'responsables'  => $responsables,
            'stats'         => $stats,
            'paises'        => $paises,
            'departamentos' => $departamentos,
            'cargos'        => $cargos,
            'empresas'      => $empresas,
            'sucursales'    => $sucursales,
            'usuarios'      => $usuarios,
            'filters'       => $request->only('search', 'status', 'perPage', 'departamento_id'),
        ]);
    }

    public function store(ResponsableRequest $request)
    {
        Responsable::create($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Responsible created successfully.'),
        ]);
    }

    public function update(ResponsableRequest $request, Responsable $responsable)
    {
        $responsable->update($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Responsible updated successfully.'),
        ]);
    }

    public function toggleStatus(Responsable $responsable)
    {
        $responsable->update(['status' => $responsable->status ? 0 : 1]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }

    public function destroy(Responsable $responsable)
    {
        $responsable->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Responsible deleted successfully.'),
        ]);
    }
}
