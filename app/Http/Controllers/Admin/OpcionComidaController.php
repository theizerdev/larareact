<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\OpcionComidaRequest;
use App\Models\OpcionComida;
use App\Models\Proveedor;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OpcionComidaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = OpcionComida::with(['sucursal', 'empresa', 'proveedor'])
            ->when($request->filled('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombre', 'like', "%{$search}%")
                        ->orWhere('descripcion', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('tipo'), function ($q) use ($request) {
                $q->where('tipo', $request->input('tipo'));
            })
            ->when($request->filled('status'), function ($q) use ($request) {
                $q->where('status', (bool) $request->input('status'));
            })
            ->when($request->filled('sucursal_id'), function ($q) use ($request) {
                $q->where('sucursal_id', (int) $request->input('sucursal_id'));
            })
            ->when($request->filled('proveedor_id'), function ($q) use ($request) {
                $q->where('proveedor_id', (int) $request->input('proveedor_id'));
            });

        $opciones = $query->orderBy('orden', 'asc')
            ->orderBy('id', 'asc')
            ->paginate($request->input('perPage', 15))
            ->withQueryString();

        $stats = [
            'total' => OpcionComida::count(),
            'activos' => OpcionComida::where('status', true)->count(),
            'inactivos' => OpcionComida::where('status', false)->count(),
            'desayuno' => OpcionComida::where('tipo', OpcionComida::TIPO_DESAYUNO)->where('status', true)->count(),
            'almuerzo' => OpcionComida::where('tipo', OpcionComida::TIPO_ALMUERZO)->where('status', true)->count(),
            'cena' => OpcionComida::where('tipo', OpcionComida::TIPO_CENA)->where('status', true)->count(),
            'refrigerio' => OpcionComida::where('tipo', OpcionComida::TIPO_REFRIGERIO)->where('status', true)->count(),
        ];

        $sucursalesQuery = Sucursal::where('status', true)->orderBy('nombre', 'asc');
        if ($user && $user->empresa_id && ! $user->isSuperAdmin()) {
            $sucursalesQuery->where('empresa_id', $user->empresa_id);
        }

        $proveedoresQuery = Proveedor::withoutGlobalScope('multitenancy')
            ->where('status', 'activo')
            ->orderBy('nombre_comercial', 'asc');

        if ($user && ! $user->isSuperAdmin()) {
            if ($user->empresa_id) {
                $proveedoresQuery->where('empresa_id', $user->empresa_id);
            }
            if ($user->sucursal_id) {
                $proveedoresQuery->where(function ($q) use ($user) {
                    $q->where('sucursal_id', $user->sucursal_id)
                        ->orWhereNull('sucursal_id');
                });
            }
        }

        $sucursalUsuario = ($user && $user->sucursal_id)
            ? Sucursal::find($user->sucursal_id)
            : null;

        return Inertia::render('admin/asistencia/comedor/Index', [
            'opciones' => $opciones,
            'stats' => $stats,
            'tipos' => OpcionComida::TIPOS,
            'sucursales' => $sucursalesQuery->get(['id', 'nombre', 'empresa_id']),
            'proveedores' => $proveedoresQuery->get(['id', 'nombre_comercial', 'razon_social', 'rfc', 'sucursal_id']),
            'sucursal_usuario' => $sucursalUsuario ? [
                'id' => $sucursalUsuario->id,
                'nombre' => $sucursalUsuario->nombre,
                'empresa_id' => $sucursalUsuario->empresa_id,
            ] : null,
            'filters' => $request->only('search', 'tipo', 'status', 'sucursal_id', 'proveedor_id', 'perPage'),
        ]);
    }

    public function store(OpcionComidaRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();

        if (empty($validated['sucursal_id']) && $user && $user->sucursal_id) {
            $validated['sucursal_id'] = $user->sucursal_id;
        }

        if (! isset($validated['orden']) || $validated['orden'] === null) {
            $validated['orden'] = (OpcionComida::max('orden') ?? 0) + 1;
        }
        if (! isset($validated['status'])) {
            $validated['status'] = true;
        }

        OpcionComida::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Opción de comida creada exitosamente.',
        ]);
    }

    public function update(OpcionComidaRequest $request, OpcionComida $opcionComida)
    {
        $opcionComida->update($request->validated());

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Opción de comida actualizada exitosamente.',
        ]);
    }

    public function toggleStatus(OpcionComida $opcionComida)
    {
        $opcionComida->update([
            'status' => ! $opcionComida->status,
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => $opcionComida->status ? 'Opción de comida activada.' : 'Opción de comida desactivada.',
        ]);
    }

    public function destroy(OpcionComida $opcionComida)
    {
        $opcionComida->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Opción de comida eliminada correctamente.',
        ]);
    }
}
