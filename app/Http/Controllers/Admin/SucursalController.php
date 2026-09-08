<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\InteractsWithTransactions;
use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use Illuminate\Http\Request;

class SucursalController extends Controller
{
    use InteractsWithTransactions;

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $empresaId = $request->input('empresa_id');
        $perPage = $request->input('perPage', 10);

        $query = Sucursal::with('empresa');

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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre' => 'required|string|max:255',
            'codigo_numeral' => 'nullable|string|max:2',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'status' => 'boolean',
        ]);

        return $this->transactional(
            fn () => Sucursal::create($validated),
            successMessage: __('Branch created successfully.'),
            failureMessage: __('There was an error creating the branch. Please try again.'),
            errorKey: 'nombre',
            context: ['action' => 'sucursales.store'],
        );
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre' => 'required|string|max:255',
            'codigo_numeral' => 'nullable|string|max:2',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
            'zona_horaria' => 'nullable|string|max:100',
            'status' => 'boolean',
        ]);

        return $this->transactional(
            function () use ($sucursal, $validated) {
                if (! $sucursal->update($validated)) {
                    throw new \RuntimeException("No se pudo actualizar la sucursal {$sucursal->id}.");
                }
            },
            successMessage: __('Branch updated successfully.'),
            failureMessage: __('There was an error updating the branch. Please try again.'),
            errorKey: 'nombre',
            context: ['action' => 'sucursales.update', 'sucursal_id' => $sucursal->id],
        );
    }

    public function destroy(Sucursal $sucursal)
    {
        return $this->transactional(
            function () use ($sucursal) {
                // `delete()` devuelve false si un observer aborta el borrado, y
                // 0 si la fila ya no existe. Ambos casos deben verse como fallo,
                // no como un borrado que en realidad no ocurrió.
                if (! $sucursal->delete()) {
                    throw new \RuntimeException("No se pudo eliminar la sucursal {$sucursal->id}.");
                }
            },
            successMessage: __('Branch deleted successfully.'),
            failureMessage: __('There was an error deleting the branch. Please try again.'),
            errorKey: 'general',
            context: ['action' => 'sucursales.destroy', 'sucursal_id' => $sucursal->id],
        );
    }

    public function toggleStatus(Sucursal $sucursal)
    {
        return $this->transactional(
            function () use ($sucursal) {
                $fresh = Sucursal::whereKey($sucursal->getKey())->lockForUpdate()->firstOrFail();
                $fresh->status = ! $fresh->status;
                $fresh->save();
            },
            successMessage: __('Status updated successfully.'),
            failureMessage: __('There was an error updating the status. Please try again.'),
            errorKey: 'status',
            context: ['action' => 'sucursales.toggleStatus', 'sucursal_id' => $sucursal->id],
        );
    }
}
