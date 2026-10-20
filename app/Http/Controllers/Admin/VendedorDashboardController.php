<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\OrdenReparacion;
use App\Models\Pais;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class VendedorDashboardController extends Controller
{
    /**
     * Display the hybrid dashboard with sales, repairs, commissions, charts, and view selector.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $empresaId = (int) $user?->empresa_id;

        $empresa = $user?->empresa;
        if (!$empresa && $empresaId) {
            $empresa = Empresa::find($empresaId);
        }

        $pais = $empresa?->pais ?? $empresa?->paisTelefono ?? ($empresa?->pais_id ? Pais::find($empresa->pais_id) : null);
        $currencySymbol = $pais?->simbolo_moneda ?? '$';
        $currencyCode = $pais?->moneda_principal ?? 'MXN';
        $timezone = $empresa?->getTimezone() ?? $user?->getTimezone() ?? $pais?->zona_horaria ?? 'America/Mexico_City';

        $isAdmin = $user && (
            $user->hasRole('Administrador') ||
            $user->hasRole('Super Administrador') ||
            $user->hasRole('super-admin') ||
            $user->hasRole('Admin')
        );

        $isTecnico = $user && ($user->hasRole('Técnico') || $user->hasRole('tecnico') || $user->hasRole('Tecnico'));
        $isVendedor = $user && ($user->hasRole('Vendedor') || $user->hasRole('vendedor') || $user->hasRole('Seller'));
        $isHybrid = ($isTecnico && $isVendedor) || $isAdmin;

        // Resolver el empleado asociado
        $empleado = null;
        if ($isAdmin && $request->filled('empleado_id')) {
            $empleado = Empleado::where('empresa_id', $empresaId)->find($request->input('empleado_id'));
        }
        if (!$empleado) {
            $empleado = $user?->empleado ?? Empleado::where('user_id', $user?->id)->where('empresa_id', $empresaId)->first();
        }
        if (!$empleado && $isAdmin) {
            $empleado = Empleado::where('empresa_id', $empresaId)->first();
        }

        // Si el usuario es admin, obtener lista de empleados para permitir filtrar
        $empleadosList = [];
        if ($isAdmin) {
            $empleadosList = Empleado::where('empresa_id', $empresaId)
                ->where('activo', true)
                ->orderBy('nombres')
                ->get(['id', 'nombres', 'apellidos', 'cargo', 'porcentaje_comision', 'porcentaje_comision_reparacion']);
        }

        // Manejo de rango de fechas y presets
        $nowInTz = Carbon::now($timezone);
        $preset = $request->input('preset', 'mes');

        switch ($preset) {
            case 'hoy':
                $startDateLocal = $nowInTz->copy()->startOfDay();
                $endDateLocal = $nowInTz->copy()->endOfDay();
                break;
            case 'ayer':
                $startDateLocal = $nowInTz->copy()->subDay()->startOfDay();
                $endDateLocal = $nowInTz->copy()->subDay()->endOfDay();
                break;
            case 'semana':
                $startDateLocal = $nowInTz->copy()->startOfWeek()->startOfDay();
                $endDateLocal = $nowInTz->copy()->endOfDay();
                break;
            case 'ultimos_30':
                $startDateLocal = $nowInTz->copy()->subDays(29)->startOfDay();
                $endDateLocal = $nowInTz->copy()->endOfDay();
                break;
            case 'custom':
                $startDateLocal = $request->input('start_date')
                    ? Carbon::parse($request->input('start_date'), $timezone)->startOfDay()
                    : $nowInTz->copy()->startOfMonth()->startOfDay();
                $endDateLocal = $request->input('end_date')
                    ? Carbon::parse($request->input('end_date'), $timezone)->endOfDay()
                    : $nowInTz->copy()->endOfDay();
                break;
            case 'mes':
            default:
                $preset = 'mes';
                $startDateLocal = $nowInTz->copy()->startOfMonth()->startOfDay();
                $endDateLocal = $nowInTz->copy()->endOfDay();
                break;
        }

        $startDateUtc = $startDateLocal->copy()->setTimezone('UTC');
        $endDateUtc = $endDateLocal->copy()->setTimezone('UTC');
        $offset = $nowInTz->format('P');

        // Estructuras por defecto
        $stats = [
            'ventas' => [
                'total_ventas' => 0.0,
                'cantidad_ventas' => 0,
                'ticket_promedio' => 0.0,
                'comisiones_generadas' => 0.0,
                'comisiones_pendientes' => 0.0,
                'comisiones_pagadas' => 0.0,
            ],
            'taller' => [
                'total_reparaciones_monto' => 0.0,
                'cantidad_reparaciones' => 0,
                'ticket_promedio' => 0.0,
                'comisiones_generadas' => 0.0,
                'comisiones_pendientes' => 0.0,
                'comisiones_pagadas' => 0.0,
            ],
            'global' => [
                'total_ingresos' => 0.0,
                'total_operaciones' => 0,
                'comisiones_totales' => 0.0,
                'comisiones_pendientes' => 0.0,
                'comisiones_pagadas' => 0.0,
            ],
            'all_time' => [
                'total_ventas' => 0.0,
                'total_reparaciones' => 0.0,
                'total_ingresos' => 0.0,
                'comisiones_totales' => 0.0,
                'comisiones_pendientes' => 0.0,
                'comisiones_pagadas' => 0.0,
            ],
        ];

        $tallerCounts = [
            'en_diagnostico' => 0,
            'en_reparacion' => 0,
            'esperando_repuesto' => 0,
            'reparado_mes' => 0,
            'total_asignados' => 0,
        ];

        $charts = [
            'trend' => [
                'categories' => [],
                'sales' => [],
                'commissions_ventas' => [],
                'commissions_taller' => [],
                'commissions_totales' => [],
                'orders' => [],
            ],
            'paymentMethods' => [
                'labels' => [],
                'series' => [],
            ],
            'topProducts' => [
                'categories' => [],
                'quantities' => [],
                'amounts' => [],
                'list' => [],
            ],
        ];

        $recentSales = [];
        $recentRepairs = [];
        $misEquiposPendientes = [];
        $sinAsignar = [];

        if ($empleado) {
            // ── 1. VENTAS DEL VENDEDOR ──────────────────────────────────────────
            $salesBaseQuery = Sale::query()
                ->where('empresa_id', $empresaId)
                ->where('empleado_id', $empleado->id)
                ->where('estado', '!=', 'cancelada');

            $salesRangeQuery = (clone $salesBaseQuery)->whereBetween('created_at', [$startDateUtc, $endDateUtc]);

            $totalVentas = (float) ((clone $salesRangeQuery)->sum('total') ?? 0);
            $cantidadVentas = (int) ((clone $salesRangeQuery)->count() ?? 0);
            $ticketPromedioVentas = $cantidadVentas > 0 ? round($totalVentas / $cantidadVentas, 2) : 0.0;
            $comisionesVentasGeneradas = (float) ((clone $salesRangeQuery)->sum('comision_monto') ?? 0);
            $comisionesVentasPendientes = (float) ((clone $salesRangeQuery)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $comisionesVentasPagadas = (float) ((clone $salesRangeQuery)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            // Ventas históricas
            $allTimeVentas = (float) ((clone $salesBaseQuery)->sum('total') ?? 0);
            $allTimeVentasPendientes = (float) ((clone $salesBaseQuery)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $allTimeVentasPagadas = (float) ((clone $salesBaseQuery)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            // ── 2. REPARACIONES DEL TÉCNICO ─────────────────────────────────────
            $repairsBaseQuery = OrdenReparacion::query()
                ->where('empresa_id', $empresaId)
                ->where(function ($q) use ($empleado) {
                    $q->where('empleado_id', $empleado->id);
                    if ($empleado->user_id) {
                        $q->orWhere('tecnico_id', $empleado->user_id);
                    }
                })
                ->where('estado_orden', '!=', 'cancelado');

            $repairsRangeQuery = (clone $repairsBaseQuery)->whereBetween('created_at', [$startDateUtc, $endDateUtc]);

            $totalReparacionesMonto = (float) ((clone $repairsRangeQuery)->sum(DB::raw('COALESCE(costo_estimado, costo_mano_obra, 0)')) ?? 0);
            $cantidadReparaciones = (int) ((clone $repairsRangeQuery)->count() ?? 0);
            $ticketPromedioReparaciones = $cantidadReparaciones > 0 ? round($totalReparacionesMonto / $cantidadReparaciones, 2) : 0.0;
            $comisionesReparacionesGeneradas = (float) ((clone $repairsRangeQuery)->sum('comision_monto') ?? 0);
            $comisionesReparacionesPendientes = (float) ((clone $repairsRangeQuery)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $comisionesReparacionesPagadas = (float) ((clone $repairsRangeQuery)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            // Reparaciones históricas
            $allTimeReparaciones = (float) ((clone $repairsBaseQuery)->sum(DB::raw('COALESCE(costo_estimado, costo_mano_obra, 0)')) ?? 0);
            $allTimeReparacionesPendientes = (float) ((clone $repairsBaseQuery)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $allTimeReparacionesPagadas = (float) ((clone $repairsBaseQuery)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            // Conteos de carga de trabajo activa en taller (Independientes del filtro de fecha)
            $tallerCounts = [
                'en_diagnostico' => (clone $repairsBaseQuery)->whereIn('estado_orden', ['en_diagnostico', 'en_diagnostico_presupuesto'])->count(),
                'en_reparacion' => (clone $repairsBaseQuery)->where('estado_orden', 'en_reparacion')->count(),
                'esperando_repuesto' => (clone $repairsBaseQuery)->whereIn('estado_orden', ['esperando_repuesto', 'espera_refaccion'])->count(),
                'reparado_mes' => (clone $repairsBaseQuery)->whereIn('estado_orden', ['reparado', 'listo_reparado'])->where('updated_at', '>=', $nowInTz->copy()->startOfMonth()->setTimezone('UTC'))->count(),
                'total_asignados' => (clone $repairsBaseQuery)->whereNotIn('estado_orden', ['entregado', 'entregado_finalizado', 'cancelado', 'listo_sin_solucion'])->count(),
            ];

            // ── 3. METRICAS GLOBALES Y COMBINADAS ────────────────────────────────
            $stats = [
                'ventas' => [
                    'total_ventas' => round($totalVentas, 2),
                    'cantidad_ventas' => $cantidadVentas,
                    'ticket_promedio' => $ticketPromedioVentas,
                    'comisiones_generadas' => round($comisionesVentasGeneradas, 2),
                    'comisiones_pendientes' => round($comisionesVentasPendientes, 2),
                    'comisiones_pagadas' => round($comisionesVentasPagadas, 2),
                ],
                'taller' => [
                    'total_reparaciones_monto' => round($totalReparacionesMonto, 2),
                    'cantidad_reparaciones' => $cantidadReparaciones,
                    'ticket_promedio' => $ticketPromedioReparaciones,
                    'comisiones_generadas' => round($comisionesReparacionesGeneradas, 2),
                    'comisiones_pendientes' => round($comisionesReparacionesPendientes, 2),
                    'comisiones_pagadas' => round($comisionesReparacionesPagadas, 2),
                ],
                'global' => [
                    'total_ingresos' => round($totalVentas + $totalReparacionesMonto, 2),
                    'total_operaciones' => $cantidadVentas + $cantidadReparaciones,
                    'comisiones_totales' => round($comisionesVentasGeneradas + $comisionesReparacionesGeneradas, 2),
                    'comisiones_pendientes' => round($comisionesVentasPendientes + $comisionesReparacionesPendientes, 2),
                    'comisiones_pagadas' => round($comisionesVentasPagadas + $comisionesReparacionesPagadas, 2),
                ],
                'all_time' => [
                    'total_ventas' => round($allTimeVentas, 2),
                    'total_reparaciones' => round($allTimeReparaciones, 2),
                    'total_ingresos' => round($allTimeVentas + $allTimeReparaciones, 2),
                    'comisiones_totales' => round($allTimeVentasPendientes + $allTimeVentasPagadas + $allTimeReparacionesPendientes + $allTimeReparacionesPagadas, 2),
                    'comisiones_pendientes' => round($allTimeVentasPendientes + $allTimeReparacionesPendientes, 2),
                    'comisiones_pagadas' => round($allTimeVentasPagadas + $allTimeReparacionesPagadas, 2),
                ],
            ];

            // ── 4. GRÁFICA DE TENDENCIA DIARIA (VENTAS + COMISIONES TALLER & POS) ──
            $salesTrend = (clone $salesRangeQuery)
                ->select(
                    DB::raw("DATE(CONVERT_TZ(created_at, '+00:00', '{$offset}')) as date_str"),
                    DB::raw('SUM(total) as daily_total'),
                    DB::raw('SUM(comision_monto) as daily_commission'),
                    DB::raw('COUNT(id) as daily_orders')
                )
                ->groupBy('date_str')
                ->get()
                ->keyBy('date_str');

            $repairsTrend = (clone $repairsRangeQuery)
                ->select(
                    DB::raw("DATE(CONVERT_TZ(created_at, '+00:00', '{$offset}')) as date_str"),
                    DB::raw('SUM(comision_monto) as daily_commission'),
                    DB::raw('COUNT(id) as daily_repairs')
                )
                ->groupBy('date_str')
                ->get()
                ->keyBy('date_str');

            $chartDates = [];
            $chartSales = [];
            $chartCommissionsVentas = [];
            $chartCommissionsTaller = [];
            $chartCommissionsTotales = [];
            $chartOrders = [];

            $curr = $startDateLocal->copy()->startOfDay();
            $targetEnd = $endDateLocal->copy()->startOfDay();
            $diffDays = $curr->diffInDays($targetEnd);

            if ($diffDays <= 45) {
                while ($curr->lte($targetEnd)) {
                    $dStr = $curr->format('Y-m-d');
                    $sRow = $salesTrend->get($dStr);
                    $rRow = $repairsTrend->get($dStr);

                    $chartDates[] = $curr->format('d M');
                    $salesVal = $sRow ? round((float) $sRow->daily_total, 2) : 0.0;
                    $commVentas = $sRow ? round((float) $sRow->daily_commission, 2) : 0.0;
                    $commTaller = $rRow ? round((float) $rRow->daily_commission, 2) : 0.0;

                    $chartSales[] = $salesVal;
                    $chartCommissionsVentas[] = $commVentas;
                    $chartCommissionsTaller[] = $commTaller;
                    $chartCommissionsTotales[] = round($commVentas + $commTaller, 2);
                    $chartOrders[] = ($sRow ? (int) $sRow->daily_orders : 0) + ($rRow ? (int) $rRow->daily_repairs : 0);

                    $curr->addDay();
                }
            } else {
                $allDates = $salesTrend->keys()->merge($repairsTrend->keys())->unique()->sort();
                foreach ($allDates as $dStr) {
                    $sRow = $salesTrend->get($dStr);
                    $rRow = $repairsTrend->get($dStr);

                    $chartDates[] = Carbon::parse($dStr)->format('d M');
                    $commVentas = $sRow ? round((float) $sRow->daily_commission, 2) : 0.0;
                    $commTaller = $rRow ? round((float) $rRow->daily_commission, 2) : 0.0;

                    $chartSales[] = $sRow ? round((float) $sRow->daily_total, 2) : 0.0;
                    $chartCommissionsVentas[] = $commVentas;
                    $chartCommissionsTaller[] = $commTaller;
                    $chartCommissionsTotales[] = round($commVentas + $commTaller, 2);
                    $chartOrders[] = ($sRow ? (int) $sRow->daily_orders : 0) + ($rRow ? (int) $rRow->daily_repairs : 0);
                }
            }

            $charts['trend'] = [
                'categories' => $chartDates,
                'sales' => $chartSales,
                'commissions_ventas' => $chartCommissionsVentas,
                'commissions_taller' => $chartCommissionsTaller,
                'commissions_totales' => $chartCommissionsTotales,
                'orders' => $chartOrders,
            ];

            // ── 5. DESGLOSE DE MÉTODOS DE PAGO ──────────────────────────────────
            $paymentBreakdown = (clone $salesRangeQuery)
                ->select('metodo_pago', DB::raw('SUM(total) as total'))
                ->groupBy('metodo_pago')
                ->orderBy('total', 'desc')
                ->get();

            $pmLabels = [];
            $pmSeries = [];
            foreach ($paymentBreakdown as $pb) {
                $rawMethod = strtolower($pb->metodo_pago ?? 'otro');
                $label = match ($rawMethod) {
                    'efectivo' => 'Efectivo',
                    'tarjeta' => 'Tarjeta',
                    'transferencia' => 'Transferencia',
                    'credito' => 'Crédito',
                    'dolar', 'dolares' => 'Dólares (USD)',
                    'mixto' => 'Pago Mixto',
                    default => ucfirst($pb->metodo_pago ?? 'Otro'),
                };
                $pmLabels[] = $label;
                $pmSeries[] = round((float) $pb->total, 2);
            }

            $charts['paymentMethods'] = [
                'labels' => $pmLabels,
                'series' => $pmSeries,
            ];

            // ── 6. TOP 5 PRODUCTOS ──────────────────────────────────────────────
            $topItems = SaleItem::whereHas('sale', function ($q) use ($startDateUtc, $endDateUtc, $empresaId, $empleado) {
                $q->where('empresa_id', $empresaId)
                    ->where('empleado_id', $empleado->id)
                    ->where('estado', '!=', 'cancelada')
                    ->whereBetween('created_at', [$startDateUtc, $endDateUtc]);
            })
            ->select('nombre', DB::raw('SUM(cantidad) as total_qty'), DB::raw('SUM(subtotal) as total_amount'))
            ->groupBy('nombre')
            ->orderBy('total_qty', 'desc')
            ->limit(5)
            ->get();

            $maxQty = $topItems->max('total_qty') ?: 1;
            $topItemsFormatted = $topItems->map(function ($item, $idx) use ($maxQty) {
                $qty = (int) $item->total_qty;
                $amt = (float) $item->total_amount;
                return [
                    'rank' => $idx + 1,
                    'nombre' => $item->nombre,
                    'total_qty' => $qty,
                    'total_amount' => round($amt, 2),
                    'percent_of_max' => min(100, round(($qty / $maxQty) * 100)),
                ];
            })->values()->toArray();

            $charts['topProducts'] = [
                'categories' => $topItems->pluck('nombre')->toArray(),
                'quantities' => $topItems->pluck('total_qty')->map(fn ($v) => (int) $v)->toArray(),
                'amounts' => $topItems->pluck('total_amount')->map(fn ($v) => round((float) $v, 2))->toArray(),
                'list' => $topItemsFormatted,
            ];

            // ── 7. ÚLTIMAS VENTAS ───────────────────────────────────────────────
            $recentSales = (clone $salesBaseQuery)
                ->with(['cliente'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($s) use ($timezone) {
                    return [
                        'id' => $s->id,
                        'codigo_ticket' => $s->codigo_ticket,
                        'cliente_nombre' => $s->cliente_nombre ?? $s->cliente?->nombre ?? 'Cliente General',
                        'metodo_pago' => $s->metodo_pago,
                        'total' => (float) $s->total,
                        'comision_porcentaje' => (float) $s->comision_porcentaje,
                        'comision_monto' => (float) $s->comision_monto,
                        'comision_estado' => $s->comision_estado ?? 'pendiente',
                        'created_at' => $s->created_at?->setTimezone($timezone)->format('d/m/Y H:i'),
                    ];
                });

            // ── 8. EQUIPOS ASIGNADOS ACTIVOS EN TALLER ──────────────────────────
            $misEquiposPendientes = (clone $repairsBaseQuery)
                ->whereNotIn('estado_orden', ['entregado', 'entregado_finalizado', 'cancelado', 'listo_sin_solucion'])
                ->orderBy('created_at', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($o) use ($timezone) {
                    return [
                        'id' => $o->id,
                        'numero_orden' => $o->numero_orden,
                        'cliente_nombre' => $o->cliente_nombre,
                        'marca_nombre' => $o->marca_nombre,
                        'modelo_nombre' => $o->modelo_nombre,
                        'imei_serie' => $o->imei_serie,
                        'descripcion_falla' => $o->descripcion_falla,
                        'estado_orden' => $o->estado_orden,
                        'costo_estimado' => (float) $o->costo_estimado,
                        'costo_total' => (float) ($o->costo_estimado ?? $o->costo_mano_obra ?? 0),
                        'comision_monto' => (float) $o->comision_monto,
                        'comision_estado' => $o->comision_estado ?? 'pendiente',
                        'fecha_recepcion' => $o->fecha_recepcion ? Carbon::parse($o->fecha_recepcion)->format('d/m/Y') : $o->created_at?->setTimezone($timezone)->format('d/m/Y'),
                    ];
                });

            // ── 9. EQUIPOS DE LA EMPRESA SIN ASIGNAR ────────────────────────────
            $sinAsignar = OrdenReparacion::where('empresa_id', $empresaId)
                ->whereNull('tecnico_id')
                ->whereNull('empleado_id')
                ->whereNotIn('estado_orden', ['entregado', 'entregado_finalizado', 'cancelado', 'listo_sin_solucion'])
                ->orderBy('created_at', 'desc')
                ->limit(6)
                ->get()
                ->map(function ($o) use ($timezone) {
                    return [
                        'id' => $o->id,
                        'numero_orden' => $o->numero_orden,
                        'cliente_nombre' => $o->cliente_nombre,
                        'marca_nombre' => $o->marca_nombre,
                        'modelo_nombre' => $o->modelo_nombre,
                        'imei_serie' => $o->imei_serie,
                        'descripcion_falla' => $o->descripcion_falla,
                        'estado_orden' => $o->estado_orden,
                        'fecha_recepcion' => $o->fecha_recepcion ? Carbon::parse($o->fecha_recepcion)->format('d/m/Y') : $o->created_at?->setTimezone($timezone)->format('d/m/Y'),
                    ];
                });

            // ── 10. ÚLTIMAS REPARACIONES REALIZADAS ─────────────────────────────
            $recentRepairs = (clone $repairsBaseQuery)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($o) use ($timezone) {
                    return [
                        'id' => $o->id,
                        'numero_orden' => $o->numero_orden,
                        'cliente_nombre' => $o->cliente_nombre,
                        'equipo' => trim("{$o->marca_nombre} {$o->modelo_nombre}"),
                        'total' => (float) ($o->costo_estimado ?? $o->costo_mano_obra ?? 0),
                        'comision_monto' => (float) $o->comision_monto,
                        'comision_estado' => $o->comision_estado ?? 'pendiente',
                        'estado_orden' => $o->estado_orden,
                        'created_at' => $o->created_at?->setTimezone($timezone)->format('d/m/Y H:i'),
                    ];
                });
        }

        // Determinar vista inicial
        $initialView = $request->input('view');
        if (!$initialView) {
            if ($isHybrid || $isAdmin) {
                $initialView = 'hibrido';
            } elseif ($isTecnico) {
                $initialView = 'taller';
            } else {
                $initialView = 'ventas';
            }
        }

        return Inertia::render('admin/Vendedor/Dashboard', [
            'empleado' => $empleado ? [
                'id' => $empleado->id,
                'nombre_completo' => trim("{$empleado->nombres} {$empleado->apellidos}"),
                'cargo' => $empleado->cargo ?? ($isHybrid ? 'Técnico y Vendedor' : ($isTecnico ? 'Técnico' : 'Vendedor')),
                'porcentaje_comision' => (float) $empleado->porcentaje_comision,
                'comision_aplica_a' => $empleado->comision_aplica_a ?? 'total',
                'porcentaje_comision_reparacion' => (float) $empleado->porcentaje_comision_reparacion,
                'comision_reparacion_aplica_a' => $empleado->comision_reparacion_aplica_a ?? 'mano_obra',
                'foto' => $empleado->foto,
            ] : null,
            'empleadosList' => $empleadosList,
            'isAdmin' => $isAdmin,
            'isTecnico' => $isTecnico,
            'isVendedor' => $isVendedor,
            'isHybrid' => $isHybrid,
            'activeView' => $initialView,
            'stats' => $stats,
            'tallerCounts' => $tallerCounts,
            'misEquiposPendientes' => $misEquiposPendientes,
            'sinAsignar' => $sinAsignar,
            'charts' => $charts,
            'recentSales' => $recentSales,
            'recentRepairs' => $recentRepairs,
            'filters' => [
                'preset' => $preset,
                'start_date' => $startDateLocal->format('Y-m-d'),
                'end_date' => $endDateLocal->format('Y-m-d'),
                'empleado_id' => $empleado?->id,
                'view' => $initialView,
            ],
            'currencySymbol' => $currencySymbol,
            'currencyCode' => $currencyCode,
        ]);
    }
}
