<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    /**
     * Bitácora de Auditoría de Seguridad y Operaciones Sensibles por Empresa y Sucursal
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;
        $sucursalId = $user?->sucursal_id;

        $search = $request->input('search');
        $logName = $request->input('log_name');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');
        $filterSucursal = $request->input('sucursal_id', $sucursalId);

        $query = Activity::with(['causer']);

        // Aislamiento Multi-Tenant estricto por Empresa
        if ($empresaId) {
            $query->where(function ($q) use ($empresaId) {
                $q->where('empresa_id', $empresaId)
                  ->orWhere('properties->empresa_id', $empresaId)
                  ->orWhereNull('empresa_id');
            });
        }

        // Filtrado opcional por Sucursal (si está asignada o seleccionada)
        if ($filterSucursal && $filterSucursal !== 'all') {
            $sucursalUserIds = \App\Models\User::where('sucursal_id', $filterSucursal)->pluck('id');

            $query->where(function ($q) use ($filterSucursal, $sucursalUserIds) {
                $q->where('sucursal_id', $filterSucursal)
                  ->orWhere('properties->sucursal_id', $filterSucursal);

                if ($sucursalUserIds->isNotEmpty()) {
                    $q->orWhere(function ($subQ) use ($sucursalUserIds) {
                        $subQ->where('causer_type', \App\Models\User::class)
                             ->whereIn('causer_id', $sucursalUserIds);
                    });
                }
            });
        }

        if ($search) {
            $searchUserIds = \App\Models\User::where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->pluck('id');

            $query->where(function ($q) use ($search, $searchUserIds) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%");

                if ($searchUserIds->isNotEmpty()) {
                    $q->orWhere(function ($subQ) use ($searchUserIds) {
                        $subQ->where('causer_type', \App\Models\User::class)
                             ->whereIn('causer_id', $searchUserIds);
                    });
                }
            });
        }

        if ($logName && $logName !== 'all') {
            $query->where('log_name', $logName);
        }

        if ($fromDate) {
            $query->whereDate('created_at', '>=', $fromDate);
        }
        if ($toDate) {
            $query->whereDate('created_at', '<=', $toDate);
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        $categories = Activity::select('log_name')
            ->distinct()
            ->whereNotNull('log_name')
            ->pluck('log_name');

        $sucursales = $empresaId ? Sucursal::where('empresa_id', $empresaId)->get(['id', 'nombre']) : [];

        $empresa = $empresaId ? Empresa::find($empresaId) : null;
        $sucursalActual = $sucursalId ? Sucursal::find($sucursalId) : null;

        return Inertia::render('admin/Seguridad/Bitacora', [
            'logs' => $logs,
            'categories' => $categories,
            'sucursales' => $sucursales,
            'tenantInfo' => [
                'empresaNombre' => $empresa?->razon_social ?? $empresa?->nombre ?? 'Global System',
                'sucursalNombre' => $sucursalActual?->nombre ?? 'Todas las sucursales',
                'empresaId' => $empresaId,
                'sucursalId' => $sucursalId,
            ],
            'filters' => $request->only(['search', 'log_name', 'from_date', 'to_date', 'sucursal_id']),
            'stats' => [
                'totalEvents' => (clone $query)->count(),
                'todayEvents' => (clone $query)->whereDate('created_at', today())->count(),
                'contabilidadEvents' => (clone $query)->where('log_name', 'contabilidad')->count(),
                'cajaEvents' => (clone $query)->whereIn('log_name', ['caja', 'ventas', 'auth'])->count(),
            ],
        ]);
    }
}
