<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller
{
    /**
     * Bitácora de Auditoría de Seguridad y Operaciones Sensibles
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        $logName = $request->input('log_name');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $query = Activity::with(['causer']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('event', 'like', "%{$search}%")
                  ->orWhereHasMorph('causer', [\App\Models\User::class], function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                  });
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

        return Inertia::render('admin/Seguridad/Bitacora', [
            'logs' => $logs,
            'categories' => $categories,
            'filters' => $request->only(['search', 'log_name', 'from_date', 'to_date']),
            'stats' => [
                'totalEvents' => Activity::count(),
                'todayEvents' => Activity::whereDate('created_at', today())->count(),
                'contabilidadEvents' => Activity::where('log_name', 'contabilidad')->count(),
                'cajaEvents' => Activity::whereIn('log_name', ['caja', 'ventas', 'auth'])->count(),
            ],
        ]);
    }
}
