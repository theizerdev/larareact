<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventarioEquipo;
use App\Models\Marca;
use App\Models\ModeloEquipo;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventarioEquipoController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $estado = $request->input('estado');
        $sucursalId = $request->input('sucursal_id');
        $marcaId = $request->input('marca_id');
        $perPage = $request->input('perPage', 10);

        $query = InventarioEquipo::with(['modelo.marca', 'sucursal']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('imei_1', 'like', "%{$search}%")
                    ->orWhere('imei_2', 'like', "%{$search}%")
                    ->orWhere('serial', 'like', "%{$search}%")
                    ->orWhere('color', 'like', "%{$search}%")
                    ->orWhereHas('modelo', function ($m) use ($search) {
                        $m->where('nombre', 'like', "%{$search}%")
                            ->orWhereHas('marca', function ($b) use ($search) {
                                $b->where('nombre', 'like', "%{$search}%");
                            });
                    });
            });
        }

        if ($estado) {
            $query->where('estado', $estado);
        }

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($marcaId) {
            $query->whereHas('modelo', function ($m) use ($marcaId) {
                $m->where('marca_id', $marcaId);
            });
        }

        $equipos = $query->latest()->paginate($perPage)->withQueryString();
        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['imei_1', 'precio_contado', 'precio_financiado', 'condicion', 'estado', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        $equipos = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => InventarioEquipo::count(),
            'disponibles' => InventarioEquipo::where('estado', 'disponible')->count(),
            'vendidos_credito' => InventarioEquipo::where('estado', 'vendido_credito')->count(),
            'en_garantia' => InventarioEquipo::where('estado', 'garantia')->count(),
        ];

        $marcas = Marca::where('activo', true)->orderBy('nombre')->get(['id', 'nombre']);
        $modelos = ModeloEquipo::with('marca')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'marca_id', 'nombre', 'almacenamiento', 'ram']);
        $sucursales = Sucursal::where('status', true)->orderBy('nombre')->get(['id', 'nombre']);

        return inertia('admin/Inventario/Index', [
            'equipos' => $equipos,
            'stats' => $stats,
            'marcas' => $marcas,
            'modelos' => $modelos,
            'sucursales' => $sucursales,
            'filters' => $request->only(['search', 'estado', 'sucursal_id', 'marca_id', 'perPage']),
            'filters' => $request->only(['search', 'estado', 'sucursal_id', 'marca_id', 'perPage', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'modelo_equipo_id' => 'required|exists:modelo_equipos,id',
            'imei_1' => 'required|string|min:14|max:20|unique:inventario_equipos,imei_1',
            'imei_2' => 'nullable|string|min:14|max:20|unique:inventario_equipos,imei_2',
            'serial' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'condicion' => 'required|in:nuevo,usado,reacondicionado',
            'costo_compra' => 'required|numeric|min:0',
            'precio_contado' => 'required|numeric|min:0',
            'precio_financiado' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
        ]);

        try {
            InventarioEquipo::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Equipo móvil registrado exitosamente en el inventario.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al registrar equipo en inventario: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al registrar el equipo: ') . $e->getMessage(),
            ]);
        }
    }

    public function update(Request $request, InventarioEquipo $equipo)
    {
        $validated = $request->validate([
            'sucursal_id' => 'required|exists:sucursales,id',
            'modelo_equipo_id' => 'required|exists:modelo_equipos,id',
            'imei_1' => 'required|string|min:14|max:20|unique:inventario_equipos,imei_1,' . $equipo->id,
            'imei_2' => 'nullable|string|min:14|max:20|unique:inventario_equipos,imei_2,' . $equipo->id,
            'serial' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'condicion' => 'required|in:nuevo,usado,reacondicionado',
            'costo_compra' => 'required|numeric|min:0',
            'precio_contado' => 'required|numeric|min:0',
            'precio_financiado' => 'required|numeric|min:0',
            'estado' => 'required|in:disponible,reservado,vendido_credito,vendido_contado,bloqueado,garantia',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $equipo->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Datos del equipo actualizados correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar equipo {$equipo->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al actualizar el equipo.'),
            ]);
        }
    }

    public function destroy(InventarioEquipo $equipo)
    {
        if ($equipo->estado === 'vendido_credito') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se puede eliminar un equipo vinculado a un crédito activo.'),
            ]);
        }

        try {
            $equipo->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Equipo eliminado del inventario.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar equipo {$equipo->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al eliminar el equipo.'),
            ]);
        }
    }
}

