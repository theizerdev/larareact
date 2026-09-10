<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ClienteController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $estado = $request->input('estado_crediticio');
        $perPage = $request->input('perPage', 10);

        $query = Cliente::query()->withCount(['creditos as creditos_activos_count' => function ($q) {
            $q->whereIn('estado', ['activo', 'en_mora']);
        }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('numero_documento', 'like', "%{$search}%")
                    ->orWhere('telefono_principal', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($estado) {
            $query->where('estado_crediticio', $estado);
        }

        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['nombres', 'numero_documento', 'limite_credito', 'estado_crediticio', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        } else {
            $query->latest();
        }

        $clientes = $query->paginate($perPage)->withQueryString();

        $stats = [
            'total' => Cliente::count(),
            'activos' => Cliente::where('estado_crediticio', 'activo')->count(),
            'en_evaluacion' => Cliente::where('estado_crediticio', 'en_evaluacion')->count(),
            'morosos' => Cliente::where('estado_crediticio', 'moroso')->count(),
        ];

        return inertia('admin/Clientes/Index', [
            'clientes' => $clientes,
            'stats' => $stats,
            'filters' => $request->only(['search', 'estado_crediticio', 'perPage', 'sort', 'direction']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'tipo_documento' => 'required|string|max:10',
            'numero_documento' => 'required|string|max:30',
            'email' => 'nullable|email|max:100',
            'telefono_principal' => 'required|string|max:25',
            'telefono_secundario' => 'nullable|string|max:25',
            'direccion' => 'nullable|string',
            'ciudad' => 'nullable|string|max:100',
            'empresa_trabajo' => 'nullable|string|max:150',
            'cargo_trabajo' => 'nullable|string|max:100',
            'ingreso_mensual' => 'nullable|numeric|min:0',
            'dia_pago' => 'nullable|in:semanal,quincenal,mensual',
            'limite_credito' => 'nullable|numeric|min:0',
            'referencias_personales' => 'nullable|array',
            'observaciones' => 'nullable|string',
        ]);

        try {
            Cliente::create($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Cliente registrado exitosamente en el sistema.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al crear cliente: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al registrar el cliente: ') . $e->getMessage(),
            ]);
        }
    }

    public function show(Cliente $cliente)
    {
        $cliente->load([
            'creditos' => function ($q) {
                $q->with(['equipo.modelo.marca', 'plan', 'cuotas'])->latest();
            },
        ]);

        return inertia('admin/Clientes/Show', [
            'cliente' => $cliente,
        ]);
    }

    public function update(Request $request, Cliente $cliente)
    {
        $validated = $request->validate([
            'nombres' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'tipo_documento' => 'required|string|max:10',
            'numero_documento' => 'required|string|max:30',
            'email' => 'nullable|email|max:100',
            'telefono_principal' => 'required|string|max:25',
            'telefono_secundario' => 'nullable|string|max:25',
            'direccion' => 'nullable|string',
            'ciudad' => 'nullable|string|max:100',
            'empresa_trabajo' => 'nullable|string|max:150',
            'cargo_trabajo' => 'nullable|string|max:100',
            'ingreso_mensual' => 'nullable|numeric|min:0',
            'dia_pago' => 'nullable|in:semanal,quincenal,mensual',
            'limite_credito' => 'nullable|numeric|min:0',
            'estado_crediticio' => 'required|in:activo,en_evaluacion,moroso,bloqueado',
            'referencias_personales' => 'nullable|array',
            'observaciones' => 'nullable|string',
        ]);

        try {
            $cliente->update($validated);

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Información del cliente actualizada correctamente.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar cliente {$cliente->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Ocurrió un error al actualizar el cliente.'),
            ]);
        }
    }

    public function destroy(Cliente $cliente)
    {
        if ($cliente->creditos()->whereIn('estado', ['activo', 'en_mora'])->exists()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No se puede eliminar un cliente con créditos activos o pendientes de pago.'),
            ]);
        }

        try {
            $cliente->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Cliente eliminado del sistema.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar cliente {$cliente->id}: {$e->getMessage()}");

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Error al eliminar el cliente.'),
            ]);
        }
    }
}

