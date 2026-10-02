<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\UserAgentParser;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;

class ActivityMonitoringController extends Controller
{
    /**
     * Map of PHP model class basenames to friendly Spanish labels.
     */
    private static array $modelNamesMap = [
        'User' => 'Usuario',
        'Empresa' => 'Empresa',
        'Sucursal' => 'Sucursal',
        'Pais' => 'País',
        'Departamento' => 'Departamento',
        'Cargo' => 'Cargo',
        'Empleado' => 'Empleado',
        'Proveedor' => 'Proveedor',
        'VisitaTemporal' => 'Visita Temporal',
        'VisitaAcceso' => 'Visita Acceso',
        'Productor' => 'Productor',
        'Responsable' => 'Responsable',
        'TurnoLaboral' => 'Turno Laboral',
        'ConfiguracionAsistencia' => 'Configuración de Asistencia',
        'AsistenciaMarcaje' => 'Marcaje de Asistencia',
        'AsistenciaResumenDiario' => 'Resumen Diario de Asistencia',
        'AsistenciaResumenSemanal' => 'Resumen Semanal de Asistencia',
        'DiaFestivo' => 'Día Festivo',
        'Role' => 'Rol',
        'Permission' => 'Permiso',
    ];

    /**
     * Map of database field names to friendly Spanish labels.
     */
    private static array $fieldLabelsMap = [
        'name' => 'Nombre',
        'nombres' => 'Nombres',
        'apellidos' => 'Apellidos',
        'email' => 'Correo electrónico',
        'phone' => 'Teléfono',
        'telefono' => 'Teléfono',
        'status' => 'Estado',
        'empleado_id' => 'Empleado',
        'responsable_id' => 'Responsable',
        'motivo_visita' => 'Motivo de visita',
        'fecha_ingreso' => 'Fecha de ingreso',
        'hora_ingreso' => 'Hora de ingreso',
        'fecha_salida' => 'Fecha de salida',
        'hora_salida' => 'Hora de salida',
        'empresa_id' => 'Empresa',
        'sucursal_id' => 'Sucursal',
        'failed_login_attempts' => 'Intentos fallidos de acceso',
        'documento_identidad' => 'Documento de identidad',
        'razon_social' => 'Razón social',
        'nombre_comercial' => 'Nombre comercial',
        'direccion_fiscal' => 'Dirección fiscal',
        'direccion' => 'Dirección',
        'ciudad' => 'Ciudad',
        'estado' => 'Estado',
        'codigo_postal' => 'Código postal',
        'rif' => 'RIF',
        'cargo_id' => 'Cargo',
        'departamento_id' => 'Departamento',
        'pais_id' => 'País',
        'activo' => 'Activo',
        'created_at' => 'Fecha de creación',
        'updated_at' => 'Fecha de actualización',
    ];

    /**
     * Display the system activity logs.
     */
    public function index(Request $request)
    {
        $query = DB::table('activity_log')
            ->leftJoin('users', function ($join) {
                $join->on('activity_log.causer_id', '=', 'users.id')
                    ->where('activity_log.causer_type', '=', 'App\\Models\\User');
            })
            ->select(
                'activity_log.*',
                'users.name as causer_name',
                'users.email as causer_email'
            );

        // Filter by Search term
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_log.description', 'like', "%{$search}%")
                    ->orWhere('activity_log.log_name', 'like', "%{$search}%")
                    ->orWhere('activity_log.event', 'like', "%{$search}%")
                    ->orWhere('activity_log.subject_type', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%")
                    ->orWhere('activity_log.properties', 'like', "%{$search}%");
            });
        }

        // Filter by Event
        if ($event = $request->input('event')) {
            if ($event !== 'all') {
                $query->where('activity_log.event', $event);
            }
        }

        // Filter by Log Name
        if ($logName = $request->input('log_name')) {
            if ($logName !== 'all') {
                $query->where('activity_log.log_name', $logName);
            }
        }

        // Filter by Subject Type (Model)
        if ($subjectType = $request->input('subject_type')) {
            if ($subjectType !== 'all') {
                $query->where('activity_log.subject_type', 'like', "%{$subjectType}%");
            }
        }

        // Filter by User / Causer
        if ($userId = $request->input('user_id')) {
            if ($userId !== 'all') {
                $query->where('activity_log.causer_id', $userId)
                    ->where('activity_log.causer_type', 'App\\Models\\User');
            }
        }

        // Filter by Date Range
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('activity_log.created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('activity_log.created_at', '<=', $dateTo);
        }

        // Real-time Overall Stats
        $stats = [
            'total' => DB::table('activity_log')->count(),
            'today' => DB::table('activity_log')->whereDate('created_at', Carbon::today())->count(),
            'created' => DB::table('activity_log')->where('event', 'created')->count(),
            'updated' => DB::table('activity_log')->where('event', 'updated')->count(),
            'deleted' => DB::table('activity_log')->where('event', 'deleted')->count(),
        ];

        // Unique filter options for dropdowns
        $availableEvents = DB::table('activity_log')
            ->whereNotNull('event')
            ->distinct()
            ->pluck('event')
            ->filter()
            ->values();

        $availableLogNames = DB::table('activity_log')
            ->whereNotNull('log_name')
            ->distinct()
            ->pluck('log_name')
            ->filter()
            ->values();

        $availableSubjectTypesRaw = DB::table('activity_log')
            ->whereNotNull('subject_type')
            ->distinct()
            ->pluck('subject_type')
            ->filter()
            ->values();

        $availableSubjectTypes = $availableSubjectTypesRaw->map(function ($fullClass) {
            $baseName = class_basename($fullClass);
            return [
                'value' => $baseName,
                'full' => $fullClass,
                'label' => self::$modelNamesMap[$baseName] ?? $baseName,
            ];
        });

        $availableUsers = DB::table('users')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        // Paginate results (20 per page)
        $perPage = 20;
        $activities = $query->orderBy('activity_log.id', 'desc')->paginate($perPage)->withQueryString();

        // Format activity items for frontend consumption
        $activities->getCollection()->transform(function ($item) {
            $properties = json_decode($item->properties ?? '{}', true) ?: [];

            // Extract IP, Agent, URL, Method
            $ipAddress = $properties['ip_address'] ?? null;
            $userAgentStr = $properties['user_agent'] ?? null;
            $url = $properties['url'] ?? null;
            $method = $properties['method'] ?? null;
            $tabla = $properties['tabla'] ?? null;
            $identificador = $properties['identificador_registro'] ?? null;

            // Parse User Agent
            $parsedAgent = UserAgentParser::parse($userAgentStr);

            // Translate Subject Model Name
            $subjectBaseClass = $item->subject_type ? class_basename($item->subject_type) : null;
            $subjectLabel = $subjectBaseClass ? __(self::$modelNamesMap[$subjectBaseClass] ?? $subjectBaseClass) : __('System');

            // Calculate Detailed Changes (Diff)
            $attributes = $properties['attributes'] ?? [];
            $old = $properties['old'] ?? [];
            $changes = [];

            if (!empty($attributes) || !empty($old)) {
                $allKeys = array_unique(array_merge(array_keys($attributes), array_keys($old)));

                foreach ($allKeys as $key) {
                    if (in_array($key, ['updated_at', 'created_at', 'deleted_at', 'remember_token', 'password'])) {
                        continue;
                    }

                    $oldVal = $old[$key] ?? null;
                    $newVal = $attributes[$key] ?? null;

                    if ($oldVal === $newVal) {
                        continue;
                    }

                    $label = __(self::$fieldLabelsMap[$key] ?? ucfirst(str_replace('_', ' ', $key)));

                    $changes[] = [
                        'key' => $key,
                        'label' => $label,
                        'old' => self::formatValue($oldVal),
                        'new' => self::formatValue($newVal),
                    ];
                }
            }

            return [
                'id' => $item->id,
                'log_name' => $item->log_name ?? 'default',
                'description' => $item->description,
                'event' => $item->event ?: ($properties['evento'] ?? 'info'),
                'subject_type' => $item->subject_type,
                'subject_type_translated' => $subjectLabel,
                'subject_id' => $item->subject_id,
                'causer' => $item->causer_name ? [
                    'id' => $item->causer_id,
                    'name' => $item->causer_name,
                    'email' => $item->causer_email,
                ] : null,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgentStr,
                'user_agent_parsed' => $parsedAgent,
                'url' => $url,
                'method' => $method,
                'tabla' => $tabla,
                'identificador' => $identificador,
                'batch_uuid' => $item->batch_uuid,
                'changes' => $changes,
                'raw_properties' => $properties,
                'created_at' => $item->created_at,
                'created_at_formatted' => Carbon::parse($item->created_at)->format('Y-m-d H:i:s'),
                'created_at_human' => Carbon::parse($item->created_at)->diffForHumans(),
            ];
        });

        return inertia('admin/monitoring/activity/index', [
            'activities' => $activities,
            'stats' => $stats,
            'filters' => $request->only(['search', 'event', 'log_name', 'subject_type', 'user_id', 'date_from', 'date_to']),
            'availableEvents' => $availableEvents,
            'availableLogNames' => $availableLogNames,
            'availableSubjectTypes' => $availableSubjectTypes,
            'availableUsers' => $availableUsers,
        ]);
    }

    /**
     * Download filtered activity log as CSV.
     */
    public function export(Request $request)
    {
        $query = DB::table('activity_log')
            ->leftJoin('users', function ($join) {
                $join->on('activity_log.causer_id', '=', 'users.id')
                    ->where('activity_log.causer_type', '=', 'App\\Models\\User');
            })
            ->select(
                'activity_log.*',
                'users.name as causer_name',
                'users.email as causer_email'
            );

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_log.description', 'like', "%{$search}%")
                    ->orWhere('activity_log.event', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%")
                    ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        if ($event = $request->input('event')) {
            if ($event !== 'all') {
                $query->where('activity_log.event', $event);
            }
        }

        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('activity_log.created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('activity_log.created_at', '<=', $dateTo);
        }

        $records = $query->orderBy('activity_log.id', 'desc')->get();

        $filename = 'actividad_sistema_' . now()->format('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($records) {
            $file = fopen('php://output', 'w');
            // Add UTF-8 BOM for Excel
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'ID',
                'Fecha y Hora',
                'Evento',
                'Descripción',
                'Usuario',
                'Email Usuario',
                'Modelo / Entidad',
                'ID Registro',
                'Dirección IP',
                'Método HTTP',
                'URL',
            ]);

            foreach ($records as $row) {
                $props = json_decode($row->properties ?? '{}', true) ?: [];
                $subjectBase = $row->subject_type ? class_basename($row->subject_type) : '';
                $subjectLabel = $subjectBase ? (self::$modelNamesMap[$subjectBase] ?? $subjectBase) : '';

                fputcsv($file, [
                    $row->id,
                    $row->created_at,
                    strtoupper($row->event ?? 'INFO'),
                    $row->description,
                    $row->causer_name ?? 'Sistema',
                    $row->causer_email ?? '',
                    $subjectLabel,
                    $row->subject_id ?? '',
                    $props['ip_address'] ?? '',
                    $props['method'] ?? '',
                    $props['url'] ?? '',
                ]);
            }

            fclose($file);
        };

        return Response::stream($callback, 200, $headers);
    }

    /**
     * Clear all records in activity_log table.
     */
    public function clear(Request $request)
    {
        DB::table('activity_log')->truncate();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('All system activity log records have been cleared successfully.'),
        ]);
    }

    /**
     * Helper to format values for display.
     */
    private static function formatValue($val): string
    {
        if (is_null($val)) {
            return '-';
        }
        if (is_bool($val)) {
            return $val ? 'Sí' : 'No';
        }
        if (is_array($val) || is_object($val)) {
            return json_encode($val, JSON_UNESCAPED_UNICODE);
        }
        return (string) $val;
    }
}
