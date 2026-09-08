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
        $request->merge([
            'latitud' => $request->latitud === '' || $request->latitud === 'null' ? null : $request->latitud,
            'longitud' => $request->longitud === '' || $request->longitud === 'null' ? null : $request->longitud,
        ]);

        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre' => 'required|string|max:255',
            'codigo_numeral' => 'nullable|string|max:2',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:100',
            'status' => 'boolean',
        ]);

        try {
            $sucursal = null;
            DB::transaction(function () use ($validated, &$sucursal) {
                $sucursal = Sucursal::create($validated);
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Branch created successfully.'),
                    'data' => $sucursal,
                ], 201);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Branch created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear sucursal: '.$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error creating the branch. Please try again.'),
                ], 500);
            }

            return back()
                ->withInput()
                ->withErrors(['general' => __('There was an error creating the branch. Please try again.')])
                ->with('notification', [
                    'type' => 'error',
                    'message' => __('There was an error creating the branch. Please try again.'),
                ]);
        }
    }

    public function update(Request $request, Sucursal $sucursal)
    {
        $request->merge([
            'latitud' => $request->latitud === '' || $request->latitud === 'null' ? null : $request->latitud,
            'longitud' => $request->longitud === '' || $request->longitud === 'null' ? null : $request->longitud,
        ]);

        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'nombre' => 'required|string|max:255',
            'codigo_numeral' => 'nullable|string|max:2',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'direccion' => 'nullable|string',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
            'zona_horaria' => 'nullable|string|max:100',
            'status' => 'boolean',
        ]);

        try {
            DB::transaction(function () use ($sucursal, $validated) {
                $sucursal->update($validated);
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Branch updated successfully.'),
                    'data' => $sucursal,
                ]);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Branch updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar sucursal {$sucursal->id}: ".$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error updating the branch. Please try again.'),
                ], 500);
            }

            return back()
                ->withInput()
                ->withErrors(['general' => __('There was an error updating the branch. Please try again.')])
                ->with('notification', [
                    'type' => 'error',
                    'message' => __('There was an error updating the branch. Please try again.'),
                ]);
        }
    }

    public function destroy(Request $request, Sucursal $sucursal)
    {
        try {
            DB::transaction(function () use ($sucursal) {
                $sucursal->delete();
            });

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => __('Branch deleted successfully.'),
                ]);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Branch deleted successfully.'),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Restricción al eliminar sucursal {$sucursal->id}: ".$e->getMessage());

            $msg = __('No se puede eliminar la sucursal porque tiene departamentos, empleados u otros registros asociados.');

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $msg,
                ], 409);
            }

            return back()
                ->withErrors(['general' => $msg])
                ->with('notification', [
                    'type' => 'error',
                    'message' => $msg,
                ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar sucursal {$sucursal->id}: ".$e->getMessage());

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => __('There was an error deleting the branch. Please try again.'),
                ], 500);
            }

            return back()
                ->withErrors(['general' => __('There was an error deleting the branch. Please try again.')])
                ->with('notification', [
                    'type' => 'error',
                    'message' => __('There was an error deleting the branch. Please try again.'),
                ]);
        }
    }

    public function toggleStatus(Sucursal $sucursal)
    {
        try {
            $sucursal->status = ! $sucursal->status;
            $sucursal->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de sucursal {$sucursal->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }
}
