<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SucursalRequest;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class SucursalController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $empresaId = $request->input('empresa_id');
        $perPage = $request->input('perPage', 10);

        $query = Sucursal::with(['empresa', 'pais']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%")
                    ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
        }

        $sucursales = $query->orderBy('nombre', 'asc')->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Sucursal::count(),
            'activos' => Sucursal::where('status', true)->count(),
            'inactivos' => Sucursal::where('status', false)->count(),
        ];

        return inertia('admin/Sucursales/Index', [
            'sucursales' => $sucursales,
            'stats' => $stats,
            'empresas' => Empresa::where('status', true)
                ->orderBy('razon_social', 'asc')
                ->get(['id', 'razon_social', 'logo_mini', 'logo']),
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters' => $request->only(['search', 'status', 'empresa_id', 'perPage']),
        ]);
    }

    public function store(SucursalRequest $request)
    {
        $this->guardEmpresa($request, $request->validated());

        DB::transaction(function () use ($request) {
            Sucursal::create($request->validated());
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Branch created successfully.'),
        ]);
    }

    public function update(SucursalRequest $request, Sucursal $sucursal)
    {
        $this->guardEmpresa($request, $request->validated());

        DB::transaction(function () use ($sucursal, $request) {
            $sucursal->update($request->validated());
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Branch updated successfully.'),
        ]);
    }

    public function destroy(Sucursal $sucursal)
    {
        // Borrado en cascada (departamentos, cargos, responsables, visitas...) vía
        // FKs onDelete('cascade'). La transacción garantiza que el árbol completo
        // se elimine de forma atómica: si algo falla, no queda estado a medias.
        DB::transaction(function () use ($sucursal) {
            $sucursal->delete();
        });

        Log::info("Sucursal {$sucursal->id} ({$sucursal->nombre}) eliminada por user ".auth()->id());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Branch deleted successfully.'),
        ]);
    }

    /**
     * Una sucursal sólo se da de alta (o se mueve) dentro de la empresa del
     * propio usuario. `empresa_id` sólo pasaba `exists:empresas`, así que un admin
     * podía crear sucursales en otra empresa o llevarse la suya a ella; ligarla a
     * otra empresa es cosa del Super Administrador.
     */
    private function guardEmpresa(Request $request, array $validated): void
    {
        $actor = $request->user();

        if ($actor->isSuperAdmin()) {
            return;
        }

        if ((int) ($validated['empresa_id'] ?? 0) !== (int) $actor->empresa_id) {
            throw ValidationException::withMessages([
                'empresa_id' => __('You are not allowed to assign this company.'),
            ]);
        }
    }

    public function toggleStatus(Sucursal $sucursal)
    {
        DB::transaction(function () use ($sucursal) {
            $sucursal->update(['status' => ! $sucursal->status]);
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Status updated successfully.'),
        ]);
    }
}
