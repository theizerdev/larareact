<?php

namespace App\Services;

use App\Helpers\UserAgentParser;
use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\OrdenReparacion;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\SubscriptionPayment;
use App\Models\Sucursal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class EmpresaActivityService
{
    /**
     * Calcula métricas y estado de actividad consolidado para una lista de empresas.
     * Diseñado para ejecutarse en batch de forma ultra-rápida (sin N+1).
     */
    public function getActivityMetricsForEmpresas(array $empresaIds): array
    {
        if (empty($empresaIds)) {
            return [];
        }

        $now = now();
        $fifteenMinutesAgo = $now->copy()->subMinutes(15)->timestamp;
        $thirtyDaysAgo = $now->copy()->subDays(30);

        // 1. Sesiones HTTP (última actividad y sesiones en línea ahora)
        $sessionRows = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->whereIn('users.empresa_id', $empresaIds)
            ->groupBy('users.empresa_id')
            ->select(
                'users.empresa_id',
                DB::raw('MAX(sessions.last_activity) as last_session_ts'),
                DB::raw("COUNT(DISTINCT CASE WHEN sessions.last_activity >= {$fifteenMinutesAgo} THEN sessions.user_id ELSE NULL END) as online_users")
            )
            ->get()
            ->keyBy('empresa_id');

        // 2. Registros de auditoría (activity_log)
        $activityRows = DB::table('activity_log')
            ->whereIn('empresa_id', $empresaIds)
            ->groupBy('empresa_id')
            ->select('empresa_id', DB::raw('MAX(created_at) as last_log_date'))
            ->get()
            ->keyBy('empresa_id');

        // 3. Ventas (ventas en los últimos 30 días y fecha de última venta)
        $salesRows = DB::table('sales')
            ->whereIn('empresa_id', $empresaIds)
            ->groupBy('empresa_id')
            ->select(
                'empresa_id',
                DB::raw('MAX(created_at) as last_sale_date'),
                DB::raw('COUNT(*) as total_sales'),
                DB::raw("SUM(CASE WHEN created_at >= '{$thirtyDaysAgo}' THEN 1 ELSE 0 END) as sales_30d"),
                DB::raw("COALESCE(SUM(CASE WHEN created_at >= '{$thirtyDaysAgo}' THEN total ELSE 0 END), 0) as amount_30d")
            )
            ->get()
            ->keyBy('empresa_id');

        // 4. Reparaciones (reparaciones en los últimos 30 días y fecha de última reparación)
        $repairRows = DB::table('ordenes_reparacion')
            ->whereIn('empresa_id', $empresaIds)
            ->groupBy('empresa_id')
            ->select(
                'empresa_id',
                DB::raw('MAX(created_at) as last_repair_date'),
                DB::raw('COUNT(*) as total_repairs'),
                DB::raw("SUM(CASE WHEN created_at >= '{$thirtyDaysAgo}' THEN 1 ELSE 0 END) as repairs_30d")
            )
            ->get()
            ->keyBy('empresa_id');

        // 5. Total de usuarios registrados por empresa
        $usersCountRows = DB::table('users')
            ->whereIn('empresa_id', $empresaIds)
            ->groupBy('empresa_id')
            ->select('empresa_id', DB::raw('COUNT(*) as total_users'))
            ->pluck('total_users', 'empresa_id');

        $metrics = [];

        foreach ($empresaIds as $empresaId) {
            $sessionInfo = $sessionRows->get($empresaId);
            $activityInfo = $activityRows->get($empresaId);
            $salesInfo = $salesRows->get($empresaId);
            $repairInfo = $repairRows->get($empresaId);
            $totalUsers = (int) ($usersCountRows->get($empresaId) ?? 0);

            $onlineUsersCount = (int) ($sessionInfo?->online_users ?? 0);
            $isOnline = $onlineUsersCount > 0;

            // Determinar la fecha/hora más reciente entre todas las fuentes
            $timestamps = [];

            if ($sessionInfo?->last_session_ts) {
                $timestamps['sesion'] = Carbon::createFromTimestamp($sessionInfo->last_session_ts);
            }
            if ($activityInfo?->last_log_date) {
                $timestamps['actividad'] = Carbon::parse($activityInfo->last_log_date);
            }
            if ($salesInfo?->last_sale_date) {
                $timestamps['venta'] = Carbon::parse($salesInfo->last_sale_date);
            }
            if ($repairInfo?->last_repair_date) {
                $timestamps['reparacion'] = Carbon::parse($repairInfo->last_repair_date);
            }

            $latestCarbon = null;
            $latestType = 'Sin actividad';

            foreach ($timestamps as $type => $carbon) {
                if ($latestCarbon === null || $carbon->gt($latestCarbon)) {
                    $latestCarbon = $carbon;
                    $latestType = match ($type) {
                        'sesion' => 'Navegación / Sesión web',
                        'venta' => 'Venta registrada',
                        'reparacion' => 'Orden de reparación',
                        'actividad' => 'Acción en el sistema',
                        default => 'Actividad',
                    };
                }
            }

            // Clasificación del estado de salud de la empresa
            $activityStatus = 'never';
            $activityStatusLabel = 'Sin actividad';

            if ($isOnline) {
                $activityStatus = 'online';
                $activityStatusLabel = 'En línea ahora';
            } elseif ($latestCarbon) {
                $diffInHours = $now->diffInHours($latestCarbon);
                $diffInDays = $now->diffInDays($latestCarbon);

                if ($diffInHours < 24) {
                    $activityStatus = 'active_today';
                    $activityStatusLabel = 'Activo hoy';
                } elseif ($diffInDays <= 7) {
                    $activityStatus = 'recent';
                    $activityStatusLabel = 'Activo hace '.$diffInDays.' día(s)';
                } else {
                    $activityStatus = 'inactive';
                    $activityStatusLabel = 'Inactivo (+'.$diffInDays.' días)';
                }
            }

            $metrics[$empresaId] = [
                'empresa_id' => $empresaId,
                'is_online' => $isOnline,
                'online_users_count' => $onlineUsersCount,
                'total_users_count' => $totalUsers,
                'activity_status' => $activityStatus,
                'activity_status_label' => $activityStatusLabel,
                'last_activity_at' => $latestCarbon?->toIso8601String(),
                'last_activity_formatted' => $latestCarbon?->format('d/m/Y H:i') ?? 'Sin registro',
                'last_activity_for_humans' => $latestCarbon ? $latestCarbon->diffForHumans() : 'Sin actividad registrada',
                'last_activity_type' => $latestType,
                'sales_30d' => (int) ($salesInfo?->sales_30d ?? 0),
                'amount_30d' => (float) ($salesInfo?->amount_30d ?? 0),
                'total_sales' => (int) ($salesInfo?->total_sales ?? 0),
                'repairs_30d' => (int) ($repairInfo?->repairs_30d ?? 0),
                'total_repairs' => (int) ($repairInfo?->total_repairs ?? 0),
            ];
        }

        return $metrics;
    }

    /**
     * Obtiene el perfil completo 360° de telemetría y movimientos para una empresa específica.
     */
    public function getDetailedActivityProfile(Empresa $empresa): array
    {
        $metrics = $this->getActivityMetricsForEmpresas([$empresa->id])[$empresa->id] ?? null;

        $now = now();
        $thirtyDaysAgo = $now->copy()->subDays(30);

        // 1. Sesiones activas recientes de esta empresa (últimas 24 horas)
        $twentyFourHoursAgo = $now->copy()->subHours(24)->timestamp;
        $activeSessionsRaw = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->where('users.empresa_id', $empresa->id)
            ->where('sessions.last_activity', '>=', $twentyFourHoursAgo)
            ->select(
                'sessions.id',
                'sessions.user_id',
                'sessions.ip_address',
                'sessions.user_agent',
                'sessions.last_activity',
                'users.name as user_name',
                'users.email as user_email'
            )
            ->orderBy('sessions.last_activity', 'desc')
            ->take(15)
            ->get();

        $activeSessions = $activeSessionsRaw->map(function ($s) use ($now) {
            $parsedAgent = UserAgentParser::parse($s->user_agent);
            $lastActivityCarbon = Carbon::createFromTimestamp($s->last_activity);
            $isLive = ($now->timestamp - $s->last_activity) <= 900; // últimos 15 min

            return [
                'id' => $s->id,
                'user_name' => $s->user_name,
                'user_email' => $s->user_email,
                'ip_address' => $s->ip_address,
                'os' => $parsedAgent['os'],
                'browser' => $parsedAgent['browser'],
                'device' => $parsedAgent['device'],
                'is_live' => $isLive,
                'last_activity_formatted' => $lastActivityCarbon->format('d/m/Y H:i:s'),
                'last_activity_human' => $lastActivityCarbon->diffForHumans(),
            ];
        });

        // 2. Inventario y Productos
        $productosTotal = Producto::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count();
        $productosConStock = Producto::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('stock', '>', 0)->count();
        $productosSinStock = Producto::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('stock', '<=', 0)->count();

        // 3. Clientes registrados
        $clientesTotal = Cliente::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count();

        // 4. Sucursales
        $sucursalesRaw = Sucursal::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->withCount(['users' => fn ($q) => $q->withoutGlobalScopes()])
            ->get();

        $firstSucursalId = $sucursalesRaw->first()?->id;

        $sucursales = $sucursalesRaw->map(fn ($suc) => [
            'id' => $suc->id,
            'nombre' => $suc->nombre,
            'telefono' => $suc->telefono,
            'direccion' => $suc->direccion,
            'is_principal' => ! empty($suc->is_principal) || ($suc->id === $firstSucursalId),
            'status' => (bool) $suc->status,
            'users_count' => $suc->users_count,
        ]);

        // 5. Usuarios
        $usuarios = User::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->with('roles')
            ->get()
            ->map(function ($u) {
                $lastActivitySession = DB::table('sessions')
                    ->where('user_id', $u->id)
                    ->max('last_activity');

                $lastActivityCarbon = $lastActivitySession ? Carbon::createFromTimestamp($lastActivitySession) : null;

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'telefono' => $u->telefono,
                    'status' => $u->status,
                    'roles' => $u->roles->pluck('name')->toArray(),
                    'last_login_human' => $lastActivityCarbon ? $lastActivityCarbon->diffForHumans() : 'Nunca',
                    'last_login_formatted' => $lastActivityCarbon ? $lastActivityCarbon->format('d/m/Y H:i') : null,
                    'created_at' => $u->created_at?->format('d/m/Y'),
                ];
            });

        // 6. Ventas estadísticas y últimas 5 ventas
        $ventasTotal = Sale::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count();
        $ventasMontoTotal = (float) Sale::withoutGlobalScopes()->where('empresa_id', $empresa->id)->sum('total');
        $ventasMesTotal = Sale::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('created_at', '>=', $thirtyDaysAgo)->count();
        $ventasMesMonto = (float) Sale::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('created_at', '>=', $thirtyDaysAgo)->sum('total');

        $ultimasVentas = Sale::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->orderBy('id', 'desc')
            ->take(6)
            ->get()
            ->map(fn ($v) => [
                'id' => $v->id,
                'codigo_ticket' => $v->codigo_ticket ?? ('#'.$v->id),
                'cliente_nombre' => $v->cliente_nombre ?: 'Público General',
                'total' => (float) $v->total,
                'metodo_pago' => $v->metodo_pago ?: 'Efectivo',
                'estado' => $v->estado,
                'fecha' => $v->created_at?->format('d/m/Y H:i'),
                'fecha_human' => $v->created_at?->diffForHumans(),
            ]);

        // 7. Reparaciones estadísticas y últimas 6 reparaciones
        $reparacionesTotal = OrdenReparacion::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count();
        $reparacionesMes = OrdenReparacion::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('created_at', '>=', $thirtyDaysAgo)->count();
        $reparacionesEnProceso = OrdenReparacion::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->whereNotIn('estado_orden', [OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO, OrdenReparacion::ESTADO_LISTO_SIN_SOLUCION])
            ->count();
        $reparacionesListas = OrdenReparacion::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->where('estado_orden', OrdenReparacion::ESTADO_LISTO_REPARADO)
            ->count();
        $reparacionesEntregadas = OrdenReparacion::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->where('estado_orden', OrdenReparacion::ESTADO_ENTREGADO_FINALIZADO)
            ->count();

        $ultimasReparaciones = OrdenReparacion::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->orderBy('id', 'desc')
            ->take(6)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'numero_orden' => $r->numero_orden,
                'cliente_nombre' => $r->cliente_nombre,
                'dispositivo' => trim(($r->marca_nombre ?? '').' '.($r->modelo_nombre ?? '').' '.($r->tipo_dispositivo ?? '')),
                'estado_orden' => $r->estado_orden,
                'costo_estimado' => (float) $r->costo_estimado,
                'fecha' => $r->created_at?->format('d/m/Y H:i'),
                'fecha_human' => $r->created_at?->diffForHumans(),
            ]);

        // 8. Cajas registradoras
        $cajasTotal = CashRegister::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count();
        $cajasAbiertas = CashRegister::withoutGlobalScopes()->where('empresa_id', $empresa->id)->where('status', 'open')->count();

        // 9. Auditoría / Historial de actividades recientes (Feed en vivo)
        $userIds = $usuarios->pluck('id')->toArray();
        $actividadesRecientes = Activity::withoutGlobalScopes()
            ->where(function ($q) use ($empresa, $userIds) {
                $q->where('empresa_id', $empresa->id)
                    ->orWhere(function ($sub) use ($userIds) {
                        $sub->where('causer_type', User::class)
                            ->whereIn('causer_id', $userIds);
                    });
            })
            ->with('causer')
            ->orderBy('id', 'desc')
            ->take(20)
            ->get()
            ->map(fn ($act) => [
                'id' => $act->id,
                'log_name' => $act->log_name,
                'description' => $act->description,
                'event' => $act->event,
                'subject_type' => $act->subject_type ? class_basename($act->subject_type) : null,
                'causer_name' => $act->causer?->name ?? 'Sistema',
                'created_at_formatted' => $act->created_at?->format('d/m/Y H:i:s'),
                'created_at_human' => $act->created_at?->diffForHumans(),
            ]);

        // 10. Suscripción y Pagos
        $latestSubscription = $empresa->getLatestSubscriptionRecord();
        $historialPagos = SubscriptionPayment::withoutGlobalScopes()
            ->where('empresa_id', $empresa->id)
            ->orderBy('id', 'desc')
            ->take(8)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'monto' => (float) $p->monto,
                'ciclo_meses' => $p->ciclo_meses,
                'metodo_pago' => $p->metodo_pago,
                'referencia_pago' => $p->referencia_pago,
                'comprobante_path' => $p->comprobante_path,
                'estado' => $p->estado,
                'created_at' => $p->created_at?->format('d/m/Y H:i'),
                'aprobado_at' => $p->aprobado_at ? Carbon::parse($p->aprobado_at)->format('d/m/Y H:i') : null,
            ]);

        // 11. Onboarding Checklist y Health Score de Adopción
        $checklist = [
            [
                'key' => 'datos_basicos',
                'title' => 'Datos fiscales y contacto',
                'description' => 'Documento, teléfono y correo registrados',
                'completed' => ! empty($empresa->documento) && (! empty($empresa->telefono) || ! empty($empresa->email)),
            ],
            [
                'key' => 'logo',
                'title' => 'Identidad de marca (Logo)',
                'description' => 'Logotipo cargado para tickets y comprobantes',
                'completed' => ! empty($empresa->logo) || ! empty($empresa->logo_mini),
            ],
            [
                'key' => 'sucursal',
                'title' => 'Sucursales configuradas',
                'description' => 'Al menos una sede o tienda registrada',
                'completed' => $sucursales->count() > 0,
            ],
            [
                'key' => 'usuarios',
                'title' => 'Equipo de colaboradores',
                'description' => 'Usuarios o cajeros agregados a la empresa',
                'completed' => $usuarios->count() > 0,
            ],
            [
                'key' => 'productos',
                'title' => 'Catálogo o inventario',
                'description' => 'Productos, repuestos o servicios cargados',
                'completed' => $productosTotal > 0,
            ],
            [
                'key' => 'clientes',
                'title' => 'Cartera de clientes',
                'description' => 'Clientes registrados en el sistema',
                'completed' => $clientesTotal > 0,
            ],
            [
                'key' => 'ventas',
                'title' => 'Primera venta procesada',
                'description' => 'Uso activo del Punto de Venta (POS)',
                'completed' => $ventasTotal > 0,
            ],
            [
                'key' => 'reparaciones',
                'title' => 'Primer servicio técnico / reparación',
                'description' => 'Uso del módulo de taller o reparaciones',
                'completed' => $reparacionesTotal > 0,
            ],
        ];

        $completedCount = collect($checklist)->where('completed', true)->count();
        $totalChecklist = count($checklist);
        $adoptionScore = round(($completedCount / $totalChecklist) * 100);

        $healthLevel = match (true) {
            $adoptionScore >= 80 => 'Excelente adopción',
            $adoptionScore >= 50 => 'En progreso activo',
            default => 'Onboarding inicial / En riesgo',
        };

        return [
            'metrics' => $metrics,
            'active_sessions' => $activeSessions,
            'stats' => [
                'productos' => [
                    'total' => $productosTotal,
                    'con_stock' => $productosConStock,
                    'sin_stock' => $productosSinStock,
                ],
                'clientes_total' => $clientesTotal,
                'sucursales_total' => $sucursales->count(),
                'usuarios_total' => $usuarios->count(),
                'cajas' => [
                    'total' => $cajasTotal,
                    'abiertas' => $cajasAbiertas,
                ],
                'ventas' => [
                    'total_count' => $ventasTotal,
                    'total_monto' => $ventasMontoTotal,
                    'mes_count' => $ventasMesTotal,
                    'mes_monto' => $ventasMesMonto,
                ],
                'reparaciones' => [
                    'total_count' => $reparacionesTotal,
                    'mes_count' => $reparacionesMes,
                    'en_proceso' => $reparacionesEnProceso,
                    'listas' => $reparacionesListas,
                    'entregadas' => $reparacionesEntregadas,
                ],
                'actividades_total' => Activity::withoutGlobalScopes()->where('empresa_id', $empresa->id)->count(),
            ],
            'adoption' => [
                'score' => $adoptionScore,
                'health_level' => $healthLevel,
                'completed_steps' => $completedCount,
                'total_steps' => $totalChecklist,
                'checklist' => $checklist,
            ],
            'sucursales' => $sucursales,
            'usuarios' => $usuarios,
            'ultimas_ventas' => $ultimasVentas,
            'ultimas_reparaciones' => $ultimasReparaciones,
            'actividades_recientes' => $actividadesRecientes,
            'subscription' => [
                'nombre_plan' => $latestSubscription?->nombre_plan ?? 'Plan Estándar',
                'estado' => $latestSubscription?->estado ?? $empresa->subscription_status ?? 'trial',
                'estado_legible' => $empresa->estado_suscripcion_legible,
                'dias_restantes' => $empresa->dias_restantes_suscripcion,
                'fecha_vencimiento' => $empresa->isExemptFromSubscription()
                    ? 'Permanente'
                    : ($latestSubscription?->fecha_vencimiento?->format('d/m/Y') ?? 'N/A'),
                'is_exempt' => $empresa->isExemptFromSubscription(),
            ],
            'historial_pagos' => $historialPagos,
        ];
    }
}
