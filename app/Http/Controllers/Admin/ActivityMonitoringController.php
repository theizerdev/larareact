<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\UserAgentParser;
use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ActivityMonitoringController extends Controller
{
    /**
     * Mapeo de modelos a nombres legibles en español.
     */
    protected static array $modelNames = [
        'Sale' => 'Venta',
        'HeldSale' => 'Venta en Espera',
        'SalePayment' => 'Pago de Venta',
        'CashRegister' => 'Caja Registradora',
        'CashMovement' => 'Movimiento de Caja',
        'Producto' => 'Producto / Repuesto',
        'Product' => 'Producto',
        'Categoria' => 'Categoría',
        'Category' => 'Categoría',
        'Marca' => 'Marca',
        'Brand' => 'Marca',
        'Familia' => 'Familia de Modelos',
        'Modelo' => 'Modelo de Dispositivo',
        'Servicio' => 'Servicio Técnico',
        'OrdenReparacion' => 'Orden de Reparación',
        'OrdenReparacionItem' => 'Ítem de Reparación',
        'OrdenReparacionHistorial' => 'Historial de Reparación',
        'OrdenReparacionFoto' => 'Foto de Reparación',
        'ReparacionChecklistItem' => 'Ítem de Checklist',
        'Cliente' => 'Cliente',
        'Customer' => 'Cliente',
        'Proveedor' => 'Proveedor',
        'Supplier' => 'Proveedor',
        'Compra' => 'Compra',
        'CompraItem' => 'Ítem de Compra',
        'CompraPago' => 'Pago a Proveedor',
        'CierreMensual' => 'Cierre Mensual',
        'AsientoContable' => 'Asiento Contable',
        'ApunteContable' => 'Apunte Contable',
        'CuentaContable' => 'Cuenta Contable',
        'ConfiguracionContable' => 'Configuración Contable',
        'Nomina' => 'Nómina',
        'NominaDetalle' => 'Detalle de Nómina',
        'User' => 'Usuario',
        'Role' => 'Rol',
        'Permission' => 'Permiso',
        'Empresa' => 'Empresa',
        'Sucursal' => 'Sucursal',
        'WhatsAppMessage' => 'Mensaje de WhatsApp',
        'WhatsAppTemplate' => 'Plantilla de WhatsApp',
    ];

    /**
     * Muestra el panel principal de monitoreo de actividades (Activity Log).
     */
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin')
            || $currentUser->hasRole('Super Admin');

        // Filtros
        $search = $request->input('search');
        $logName = $request->input('log_name', 'all');
        $event = $request->input('event', 'all');
        $causerId = $request->input('causer_id', 'all');
        $empresaId = $request->input('empresa_id', 'all');
        $dateRange = $request->input('date_range', '30_days');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $perPage = (int) $request->input('per_page', 25);
        if (! in_array($perPage, [15, 25, 50, 100])) {
            $perPage = 25;
        }

        $query = Activity::with(['causer'])->latest('id');

        // Aislamiento Multi-tenant
        if (! $isSuperAdmin) {
            if ($currentUser->empresa_id) {
                $query->where('empresa_id', $currentUser->empresa_id);
            }
            if ($currentUser->sucursal_id) {
                $query->where(function ($q) use ($currentUser) {
                    $q->where('sucursal_id', $currentUser->sucursal_id)
                        ->orWhereNull('sucursal_id');
                });
            }
        } elseif ($empresaId !== 'all' && is_numeric($empresaId)) {
            $query->where('empresa_id', (int) $empresaId);
        }

        // Filtro por Canal / Log Name
        if ($logName !== 'all' && ! empty($logName)) {
            $query->where('log_name', $logName);
        }

        // Filtro por Evento
        if ($event !== 'all' && ! empty($event)) {
            if ($event === 'login') {
                $query->where('log_name', 'auth');
            } else {
                $query->where(function ($q) use ($event) {
                    $q->where('event', $event)
                        ->orWhere('description', 'like', "%{$event}%");
                });
            }
        }

        // Filtro por Usuario Causante
        if ($causerId !== 'all' && is_numeric($causerId)) {
            $query->where('causer_id', (int) $causerId);
        }

        // Filtro por Fechas
        $query = $this->applyDateFilter($query, $dateRange, $startDate, $endDate);

        // Filtro de Búsqueda de Texto
        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%")
                    ->orWhere('properties', 'like', "%{$search}%")
                    ->orWhereHasMorph('causer', [User::class], function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Métricas y Estadísticas Globales (según scope de tenant)
        $stats = $this->calculateStats($currentUser, $isSuperAdmin, $empresaId);

        // Paginación
        $activities = $query->paginate($perPage)->withQueryString();

        // Formateo de Actividades para el Frontend
        $formattedActivities = $activities->through(function ($act) {
            return $this->formatActivity($act);
        });

        // Opciones de filtros para los selectores
        $filterOptions = $this->getFilterOptions($currentUser, $isSuperAdmin);

        return Inertia::render('admin/monitoring/activities/index', [
            'activities' => $formattedActivities,
            'stats' => $stats,
            'filters' => [
                'search' => $search,
                'log_name' => $logName,
                'event' => $event,
                'causer_id' => $causerId,
                'empresa_id' => $empresaId,
                'date_range' => $dateRange,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'per_page' => $perPage,
            ],
            'filterOptions' => $filterOptions,
            'isSuperAdmin' => $isSuperAdmin,
        ]);
    }

    /**
     * Formatea un registro de actividad para la vista.
     */
    protected function formatActivity(Activity $act): array
    {
        $props = $act->properties ? $act->properties->toArray() : [];
        $userAgent = $props['user_agent'] ?? null;
        $ip = $props['ip'] ?? $props['ip_address'] ?? null;
        $parsedAgent = UserAgentParser::parse($userAgent);

        // Determinar nombre del modelo en español
        $subjectBase = $act->subject_type ? class_basename($act->subject_type) : null;
        $subjectLabel = $subjectBase ? (self::$modelNames[$subjectBase] ?? $subjectBase) : null;

        // Detectar evento normalizado
        $detectedEvent = $act->event;
        if (! $detectedEvent) {
            if ($act->log_name === 'auth' || str_contains($act->description, 'user_logged_in') || str_contains($act->description, 'login')) {
                $detectedEvent = 'login';
            } elseif (str_contains($act->description, 'creó') || str_contains($act->description, 'created')) {
                $detectedEvent = 'created';
            } elseif (str_contains($act->description, 'actualizó') || str_contains($act->description, 'updated')) {
                $detectedEvent = 'updated';
            } elseif (str_contains($act->description, 'eliminó') || str_contains($act->description, 'deleted')) {
                $detectedEvent = 'deleted';
            } else {
                $detectedEvent = 'custom';
            }
        }

        // Extracción de diferencias (Old vs New Attributes)
        $diff = [];
        $attributes = $props['attributes'] ?? [];
        $old = $props['old'] ?? [];

        if (! empty($attributes) || ! empty($old)) {
            $allKeys = array_unique(array_merge(array_keys($attributes), array_keys($old)));
            foreach ($allKeys as $key) {
                if (in_array($key, ['created_at', 'updated_at', 'deleted_at', 'password', 'remember_token'])) {
                    continue;
                }
                $diff[] = [
                    'field' => $key,
                    'old' => $old[$key] ?? null,
                    'new' => $attributes[$key] ?? null,
                ];
            }
        }

        return [
            'id' => $act->id,
            'log_name' => $act->log_name ?? 'default',
            'description' => $act->description,
            'event' => $detectedEvent,
            'subject_type' => $act->subject_type,
            'subject_name' => $subjectLabel,
            'subject_id' => $act->subject_id,
            'causer' => $act->causer ? [
                'id' => $act->causer->id,
                'name' => $act->causer->name,
                'email' => $act->causer->email,
                'profile_photo_url' => $act->causer->profile_photo_url ?? null,
            ] : null,
            'empresa_id' => $act->empresa_id,
            'sucursal_id' => $act->sucursal_id,
            'ip_address' => $ip,
            'latitude' => $props['latitude'] ?? null,
            'longitude' => $props['longitude'] ?? null,
            'url' => $props['url'] ?? null,
            'method' => $props['method'] ?? null,
            'browser' => $parsedAgent['browser'],
            'os' => $parsedAgent['os'],
            'device' => $parsedAgent['device'],
            'properties' => $props,
            'diff' => $diff,
            'batch_uuid' => $act->batch_uuid,
            'created_at' => $act->created_at ? $act->created_at->format('Y-m-d H:i:s') : null,
            'created_at_human' => $act->created_at ? $act->created_at->diffForHumans() : null,
        ];
    }

    /**
     * Aplica los filtros de fecha a la consulta.
     */
    protected function applyDateFilter($query, string $dateRange, ?string $startDate, ?string $endDate)
    {
        return match ($dateRange) {
            'today' => $query->whereDate('created_at', Carbon::today()),
            'yesterday' => $query->whereDate('created_at', Carbon::yesterday()),
            '7_days' => $query->where('created_at', '>=', Carbon::now()->subDays(7)),
            '30_days' => $query->where('created_at', '>=', Carbon::now()->subDays(30)),
            'this_month' => $query->where('created_at', '>=', Carbon::now()->startOfMonth()),
            'custom' => $query->when($startDate, fn ($q) => $q->where('created_at', '>=', Carbon::parse($startDate)->startOfDay()))
                ->when($endDate, fn ($q) => $q->where('created_at', '<=', Carbon::parse($endDate)->endOfDay())),
            default => $query,
        };
    }

    /**
     * Calcula estadísticas globales para las tarjetas superiores.
     */
    protected function calculateStats($currentUser, bool $isSuperAdmin, $empresaId): array
    {
        $baseQuery = Activity::query();

        if (! $isSuperAdmin) {
            if ($currentUser->empresa_id) {
                $baseQuery->where('empresa_id', $currentUser->empresa_id);
            }
        } elseif ($empresaId !== 'all' && is_numeric($empresaId)) {
            $baseQuery->where('empresa_id', (int) $empresaId);
        }

        $totalActivities = (clone $baseQuery)->count();
        $todayActivities = (clone $baseQuery)->whereDate('created_at', Carbon::today())->count();
        $yesterdayActivities = (clone $baseQuery)->whereDate('created_at', Carbon::yesterday())->count();

        $createdEvents = (clone $baseQuery)->where('event', 'created')->count();
        $updatedEvents = (clone $baseQuery)->where('event', 'updated')->count();
        $deletedEvents = (clone $baseQuery)->where('event', 'deleted')->count();
        $authEvents = (clone $baseQuery)->where('log_name', 'auth')->count();

        // Top módulos más activos
        $topModules = (clone $baseQuery)
            ->select('log_name', DB::raw('count(*) as total'))
            ->groupBy('log_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($item) => [
                'name' => ucfirst($item->log_name ?? 'General'),
                'count' => $item->total,
            ]);

        return [
            'total' => $totalActivities,
            'today' => $todayActivities,
            'yesterday' => $yesterdayActivities,
            'created_count' => $createdEvents,
            'updated_count' => $updatedEvents,
            'deleted_count' => $deletedEvents,
            'auth_count' => $authEvents,
            'top_modules' => $topModules,
        ];
    }

    /**
     * Obtiene listas de opciones para los filtros de búsqueda.
     */
    protected function getFilterOptions($currentUser, bool $isSuperAdmin): array
    {
        $logNamesQuery = Activity::select('log_name')->distinct()->whereNotNull('log_name');
        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $logNamesQuery->where('empresa_id', $currentUser->empresa_id);
        }
        $logNames = $logNamesQuery->pluck('log_name')->filter()->values();

        $usersQuery = User::select('id', 'name', 'email')->orderBy('name');
        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $usersQuery->where('empresa_id', $currentUser->empresa_id);
        }
        $users = $usersQuery->limit(100)->get();

        $empresas = [];
        if ($isSuperAdmin) {
            $empresas = Empresa::on('landlord')->select('id', 'razon_social', 'nombre_comercial')->orderBy('razon_social')->get();
        }

        return [
            'log_names' => $logNames,
            'users' => $users,
            'empresas' => $empresas,
            'events' => [
                ['value' => 'all', 'label' => 'Todos los Eventos'],
                ['value' => 'created', 'label' => 'Creación (created)'],
                ['value' => 'updated', 'label' => 'Modificación (updated)'],
                ['value' => 'deleted', 'label' => 'Eliminación (deleted)'],
                ['value' => 'login', 'label' => 'Inicio de Sesión (login)'],
            ],
        ];
    }

    /**
     * Elimina un registro individual de auditoría.
     */
    public function destroy($id, Request $request)
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin');

        $activity = Activity::findOrFail($id);

        if (! $isSuperAdmin && $activity->empresa_id !== $currentUser->empresa_id) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No tienes permiso para eliminar este registro.'),
            ]);
        }

        $activity->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Registro de auditoría eliminado exitosamente.'),
        ]);
    }

    /**
     * Purga o limpia registros antiguos de actividad.
     */
    public function clear(Request $request)
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin');

        $days = (int) $request->input('days', 90);
        if ($days < 7) {
            $days = 7;
        }

        $query = Activity::where('created_at', '<', Carbon::now()->subDays($days));

        if (! $isSuperAdmin) {
            $query->where('empresa_id', $currentUser->empresa_id);
        }

        $count = $query->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Se eliminaron {$count} registros de actividad anteriores a {$days} días."),
        ]);
    }

    /**
     * Exporta los registros de actividad filtrados en formato CSV o JSON.
     */
    public function export(Request $request)
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin');

        $format = $request->input('format', 'csv');
        $search = $request->input('search');
        $logName = $request->input('log_name', 'all');
        $event = $request->input('event', 'all');
        $dateRange = $request->input('date_range', '30_days');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $query = Activity::with(['causer'])->latest('id')->limit(5000);

        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $query->where('empresa_id', $currentUser->empresa_id);
        }

        if ($logName !== 'all' && ! empty($logName)) {
            $query->where('log_name', $logName);
        }

        if ($event !== 'all' && ! empty($event)) {
            if ($event === 'login') {
                $query->where('log_name', 'auth');
            } else {
                $query->where('event', $event);
            }
        }

        $query = $this->applyDateFilter($query, $dateRange, $startDate, $endDate);

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('properties', 'like', "%{$search}%");
            });
        }

        $activities = $query->get();

        if ($format === 'json') {
            return Response::json($activities, 200, [
                'Content-Disposition' => 'attachment; filename="activity_log_export_' . now()->format('Y-m-d_His') . '.json"',
            ]);
        }

        // Exportación CSV
        $filename = 'activity_log_export_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($activities) {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM para soporte correcto de caracteres y acentos en Excel
            fprintf($handle, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Fecha / Hora',
                'Módulo (Canal)',
                'Evento',
                'Descripción',
                'Usuario Responsable',
                'Email Usuario',
                'Entidad (Subject)',
                'ID Entidad',
                'IP Origen',
                'Empresa ID',
                'Sucursal ID',
            ]);

            foreach ($activities as $act) {
                $props = $act->properties ? $act->properties->toArray() : [];
                $ip = $props['ip'] ?? $props['ip_address'] ?? '';
                $subjectBase = $act->subject_type ? class_basename($act->subject_type) : '';

                fputcsv($handle, [
                    $act->id,
                    $act->created_at ? $act->created_at->format('Y-m-d H:i:s') : '',
                    $act->log_name ?? '',
                    $act->event ?? '',
                    $act->description ?? '',
                    $act->causer ? $act->causer->name : ($props['identificador_registro'] ?? 'Sistema'),
                    $act->causer ? $act->causer->email : '',
                    $subjectBase,
                    $act->subject_id ?? '',
                    $ip,
                    $act->empresa_id ?? '',
                    $act->sucursal_id ?? '',
                ]);
            }

            fclose($handle);
        };

        return Response::stream($callback, 200, $headers);
    }
}
