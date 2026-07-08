<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SucursalController extends Controller
{
    public function index(Request $request)
    {
        $search    = $request->input('search');
        $status    = $request->input('status');
        $empresaId = $request->input('empresa_id');
        $perPage   = $request->input('perPage', 10);

        $query = Sucursal::with('empresa');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre',    'like', "%{$search}%")
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
            'total'     => Sucursal::count(),
            'activos'   => Sucursal::where('status', true)->count(),
            'inactivos' => Sucursal::where('status', false)->count(),
        ];

        return inertia('admin/Sucursales/Index', [
            'sucursales' => $sucursales,
            'stats'      => $stats,
            'empresas'   => Empresa::where('status', true)
                ->orderBy('razon_social', 'asc')
                ->get(['id', 'razon_social', 'logo_mini', 'logo']),
            'paises'     => Pais::where('activo', true)
                ->orderBy('nombre', 'asc')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico', 'latitud', 'longitud']),
            'filters'    => $request->only(['search', 'status', 'empresa_id', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre'     => 'required|string|max:255',
            'telefono'   => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion'  => 'nullable|string',
            'latitud'    => 'nullable|numeric',
            'longitud'   => 'nullable|numeric',
            'status'     => 'boolean',
        ]);

        try {
            Sucursal::create($validated);

            return back()->with('notification', [
                'type'    => 'success',
                'message' => __('Branch created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear sucursal: ' . $e->getMessage());

            return back()->with('notification', [
                'type'    => 'error',
                'message' => __('There was an error creating the branch. Please try again.'),
            ]);
        }
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre'     => 'required|string|max:255',
            'telefono'   => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion'  => 'nullable|string',
            'latitud'    => 'nullable|numeric',
            'longitud'   => 'nullable|numeric',
            'status'     => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($sucursal, $validated) {
                $sucursal->update($validated);
            });

            return back()->with('notification', [
                'type'    => 'success',
                'message' => __('Branch updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar sucursal {$sucursal->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type'    => 'error',
                'message' => __('There was an error updating the branch. Please try again.'),
            ]);
        }
    }

    public function destroy(Sucursal $sucursal)
    {
        try {
            $sucursal->delete();

            return back()->with('notification', [
                'type'    => 'success',
                'message' => __('Branch deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar sucursal {$sucursal->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type'    => 'error',
                'message' => __('There was an error deleting the branch. Please try again.'),
            ]);
        }
    }

    public function toggleStatus(Sucursal $sucursal)
    {
        try {
            $sucursal->status = !$sucursal->status;
            $sucursal->save();

            return back()->with('notification', [
                'type'    => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de sucursal {$sucursal->id}: " . $e->getMessage());

            return back()->with('notification', [
                'type'    => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }
}
