<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\User;
use App\Traits\HasSpanishActivityLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityMonitoringController extends Controller
{
    /**
     * Display system activity logs with rich auditing details.
     */
    public function index(Request $request): Response
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin')
            || $currentUser->hasRole('Super Admin');

        $query = Activity::with(['causer', 'subject']);

        // Filter by company (empresa_id)
        $empresaId = $request->input('empresa_id');
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
        } elseif ($empresaId && $empresaId !== 'all' && is_numeric($empresaId)) {
            $query->where('empresa_id', (int) $empresaId);
        }

        // Search filter
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%")
                    ->orWhere('event', 'like', "%{$search}%")
                    ->orWhere('properties', 'like', "%{$search}%")
                    ->orWhereHasMorph('causer', [User::class], function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('username', 'like', "%{$search}%");
                    });
            });
        }

        // Event filter
        if ($event = $request->input('event')) {
            if ($event === 'autenticacion' || $event === 'auth') {
                $query->where(function ($q) {
                    $q->where('log_name', 'autenticacion')
                        ->orWhere('log_name', 'auth');
                });
            } else {
                $query->where('event', $event);
            }
        }

        // Entity / Model filter
        if ($subjectType = $request->input('subject_type')) {
            $query->where('subject_type', 'like', "%{$subjectType}%");
        }

        // User filter
        if ($causer_id = $request->input('causer_id')) {
            $query->where('causer_type', User::class)
                ->where('causer_id', $causer_id);
        }

        // Date filters
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $perPage = (int) $request->input('perPage', 15);
        $activities = $query->latest('id')->paginate($perPage)->withQueryString();

        // Load company names map for fast lookup
        $empresasMap = Empresa::on('landlord')->pluck('razon_social', 'id')->toArray();

        // Transform items for the frontend
        $activities->getCollection()->transform(function ($activity) use ($empresasMap) {
            $properties = $activity->properties ? $activity->properties->toArray() : [];

            $causer = null;
            if ($activity->causer) {
                $causer = [
                    'id' => $activity->causer->id,
                    'name' => $activity->causer->name,
                    'email' => $activity->causer->email,
                ];
            }

            // Extract Class Basename and map to Spanish
            $rawSubjectType = $activity->subject_type ? class_basename($activity->subject_type) : 'Sistema';
            $modelNamesMap = User::getModelNamesMap();
            $fieldLabelsMap = User::getFieldLabelsMap();
            $subjectTypeFormatted = $modelNamesMap[$rawSubjectType] ?? $rawSubjectType;

            // Build Field Changes (diffs)
            $fieldChanges = [];
            $attributes = $properties['attributes'] ?? [];
            $old = $properties['old'] ?? [];

            if (! empty($attributes)) {
                foreach ($attributes as $key => $newValue) {
                    if (in_array($key, ['updated_at', 'created_at', 'deleted_at', 'password', 'remember_token', 'two_factor_secret'])) {
                        continue;
                    }

                    $oldValue = $old[$key] ?? null;

                    $formattedOld = is_bool($oldValue) ? ($oldValue ? 'Sí' : 'No') : (is_null($oldValue) || $oldValue === '' ? '-' : (is_array($oldValue) ? json_encode($oldValue, JSON_UNESCAPED_UNICODE) : (string) $oldValue));
                    $formattedNew = is_bool($newValue) ? ($newValue ? 'Sí' : 'No') : (is_null($newValue) || $newValue === '' ? '-' : (is_array($newValue) ? json_encode($newValue, JSON_UNESCAPED_UNICODE) : (string) $newValue));

                    $label = $fieldLabelsMap[$key] ?? ucfirst(str_replace('_', ' ', $key));

                    $fieldChanges[] = [
                        'field_key' => $key,
                        'field_label' => $label,
                        'old_value' => $formattedOld,
                        'new_value' => $formattedNew,
                    ];
                }
            }

            $method = $properties['method'] ?? ($properties['evento'] === 'login' ? 'POST' : 'GET');
            $ipAddress = $properties['ip_address'] ?? ($properties['ip'] ?? 'N/A');
            $userAgent = $properties['user_agent'] ?? null;

            // Simple Device / Browser Parser
            $deviceInfo = 'Desktop';
            if ($userAgent) {
                if (str_contains($userAgent, 'Windows')) {
                    $deviceInfo = 'Windows';
                } elseif (str_contains($userAgent, 'Macintosh') || str_contains($userAgent, 'Mac OS')) {
                    $deviceInfo = 'macOS';
                } elseif (str_contains($userAgent, 'Linux')) {
                    $deviceInfo = 'Linux';
                } elseif (str_contains($userAgent, 'Android')) {
                    $deviceInfo = 'Android';
                } elseif (str_contains($userAgent, 'iPhone') || str_contains($userAgent, 'iPad')) {
                    $deviceInfo = 'iOS';
                }

                if (str_contains($userAgent, 'Chrome') && ! str_contains($userAgent, 'Edg')) {
                    $deviceInfo .= ' • Chrome';
                } elseif (str_contains($userAgent, 'Firefox')) {
                    $deviceInfo .= ' • Firefox';
                } elseif (str_contains($userAgent, 'Safari') && ! str_contains($userAgent, 'Chrome')) {
                    $deviceInfo .= ' • Safari';
                } elseif (str_contains($userAgent, 'Edg')) {
                    $deviceInfo .= ' • Edge';
                }
            }

            return [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'event' => $activity->event ?? ($properties['evento'] ?? 'custom'),
                'subject_type' => $subjectTypeFormatted,
                'subject_type_raw' => $rawSubjectType,
                'subject_id' => $activity->subject_id,
                'causer' => $causer,
                'empresa_id' => $activity->empresa_id,
                'empresa_nombre' => $empresasMap[$activity->empresa_id] ?? null,
                'sucursal_id' => $activity->sucursal_id,
                'properties' => $properties,
                'field_changes' => $fieldChanges,
                'ip_address' => $ipAddress,
                'method' => $method,
                'device_info' => $deviceInfo,
                'url' => $properties['url'] ?? null,
                'table' => $properties['tabla'] ?? null,
                'created_at' => $activity->created_at ? $activity->created_at->format('Y-m-d H:i:s') : null,
                'created_at_human' => $activity->created_at ? $activity->created_at->diffForHumans() : null,
            ];
        });

        // Statistics (scoped by company if selected)
        $baseStatQuery = Activity::query();
        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $baseStatQuery->where('empresa_id', $currentUser->empresa_id);
        } elseif ($empresaId && $empresaId !== 'all' && is_numeric($empresaId)) {
            $baseStatQuery->where('empresa_id', (int) $empresaId);
        }

        $totalRecords = (clone $baseStatQuery)->count();
        $todayCount = (clone $baseStatQuery)->whereDate('created_at', Carbon::today())->count();
        $createdCount = (clone $baseStatQuery)->where('event', 'created')->count();
        $updatedCount = (clone $baseStatQuery)->where('event', 'updated')->count();
        $deletedCount = (clone $baseStatQuery)->where('event', 'deleted')->count();

        $stats = [
            'total' => $totalRecords,
            'today' => $todayCount,
            'created' => $createdCount,
            'updated' => $updatedCount,
            'deleted' => $deletedCount,
            'today_pct' => $totalRecords > 0 ? round(($todayCount / $totalRecords) * 100) : 0,
            'created_pct' => $totalRecords > 0 ? round(($createdCount / $totalRecords) * 100) : 0,
            'updated_pct' => $totalRecords > 0 ? round(($updatedCount / $totalRecords) * 100) : 0,
            'deleted_pct' => $totalRecords > 0 ? round(($deletedCount / $totalRecords) * 100) : 0,
        ];

        // Available models for filter dropdown
        $rawModelsQuery = Activity::distinct()->whereNotNull('subject_type');
        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $rawModelsQuery->where('empresa_id', $currentUser->empresa_id);
        } elseif ($empresaId && $empresaId !== 'all' && is_numeric($empresaId)) {
            $rawModelsQuery->where('empresa_id', (int) $empresaId);
        }
        $rawModels = $rawModelsQuery->pluck('subject_type')->filter()->values();
        $modelsList = $rawModels->map(function ($type) {
            $base = class_basename($type);
            $map = User::getModelNamesMap();

            return [
                'raw' => $base,
                'label' => $map[$base] ?? $base,
            ];
        })->unique('raw')->values();

        // Users query
        $usersQuery = User::select('id', 'name', 'email')->orderBy('name');
        if (! $isSuperAdmin && $currentUser->empresa_id) {
            $usersQuery->where('empresa_id', $currentUser->empresa_id);
        } elseif ($empresaId && $empresaId !== 'all' && is_numeric($empresaId)) {
            $usersQuery->where('empresa_id', (int) $empresaId);
        }
        $users = $usersQuery->get();

        // Empresas list for Super Admins
        $empresas = [];
        if ($isSuperAdmin) {
            $empresas = Empresa::on('landlord')->select('id', 'razon_social', 'nombre_comercial')->orderBy('razon_social')->get();
        }

        return Inertia::render('admin/monitoring/activities/index', [
            'activities' => $activities,
            'stats' => $stats,
            'users' => $users,
            'empresas' => $empresas,
            'isSuperAdmin' => $isSuperAdmin,
            'modelsList' => $modelsList,
            'filters' => $request->only(['search', 'event', 'subject_type', 'causer_id', 'empresa_id', 'date_from', 'date_to', 'perPage']),
        ]);
    }

    /**
     * Export activity logs to CSV file.
     */
    public function export(Request $request): StreamedResponse
    {
        $fileName = 'actividad_sistema_'.now()->format('Y-m-d_H-i-s').'.csv';
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin')
            || $currentUser->hasRole('Super Admin');
        $empresaId = $request->input('empresa_id');

        $response = new StreamedResponse(function () use ($currentUser, $isSuperAdmin, $empresaId) {
            $handle = fopen('php://output', 'w');
            // Write BOM for UTF-8 Excel compatibility
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['ID', 'Fecha y Hora', 'Empresa ID', 'Usuario', 'Email Usuario', 'Accion / Evento', 'Entidad / Modelo', 'ID Registro', 'Descripcion', 'IP', 'Metodo HTTP']);

            $exportQuery = Activity::with(['causer'])->latest('id');

            if (! $isSuperAdmin && $currentUser->empresa_id) {
                $exportQuery->where('empresa_id', $currentUser->empresa_id);
            } elseif ($empresaId && $empresaId !== 'all' && is_numeric($empresaId)) {
                $exportQuery->where('empresa_id', (int) $empresaId);
            }

            $exportQuery->chunk(500, function ($activities) use ($handle) {
                foreach ($activities as $act) {
                    $props = $act->properties ? $act->properties->toArray() : [];
                    $causer = $act->causer;
                    $subjectType = $act->subject_type ? class_basename($act->subject_type) : 'Sistema';

                    fputcsv($handle, [
                        $act->id,
                        $act->created_at ? $act->created_at->format('Y-m-d H:i:s') : '',
                        $act->empresa_id ?? '1',
                        $causer ? $causer->name : 'Sistema',
                        $causer ? $causer->email : '',
                        $act->event ?? ($props['evento'] ?? ''),
                        $subjectType,
                        $act->subject_id ?? '',
                        $act->description,
                        $props['ip_address'] ?? ($props['ip'] ?? 'N/A'),
                        $props['method'] ?? 'GET',
                    ]);
                }
            });

            fclose($handle);
        });

        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$fileName}\"");

        return $response;
    }

    /**
     * Truncate/Clear all activity logs.
     */
    public function clear(Request $request)
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->id === 1
            || $currentUser->hasRole('Super Administrador')
            || $currentUser->hasRole('super-admin');

        $empresaId = $request->input('empresa_id');

        if (! $isSuperAdmin && $currentUser->empresa_id) {
            Activity::where('empresa_id', $currentUser->empresa_id)->delete();
        } elseif ($isSuperAdmin && $empresaId && $empresaId !== 'all') {
            Activity::where('empresa_id', $empresaId)->delete();
        } else {
            Activity::truncate();
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('System activity logs cleared successfully.'),
        ]);
    }
}
