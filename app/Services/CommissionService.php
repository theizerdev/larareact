<?php

namespace App\Services;

use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\ComisionPago;
use App\Models\Empleado;
use App\Models\OrdenReparacion;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CommissionService
{
    /**
     * Calcular comisión correspondiente para una venta según la configuración del empleado.
     */
    public function calculateCommission(float $subtotal, float $total, Empleado $empleado): array
    {
        $porcentaje = (float) $empleado->porcentaje_comision;
        if ($porcentaje <= 0) {
            return [
                'porcentaje' => 0.0,
                'monto' => 0.0,
                'estado' => 'no_aplica',
            ];
        }

        // Determinar base imponible para la comisión (Subtotal neto sin IVA o Total)
        $base = ($empleado->comision_aplica_a === 'total') ? $total : $subtotal;
        $monto = round(($base * ($porcentaje / 100)), 2);

        return [
            'porcentaje' => $porcentaje,
            'monto' => max(0, $monto),
            'estado' => $monto > 0 ? 'pendiente' : 'no_aplica',
        ];
    }

    /**
     * Calcular comisión técnica para una orden de reparación.
     */
    public function calculateRepairCommission(OrdenReparacion $reparacion, ?Empleado $empleado = null): array
    {
        if (!$empleado && $reparacion->empleado_id) {
            $empleado = Empleado::find($reparacion->empleado_id);
        }
        if (!$empleado && $reparacion->tecnico_id) {
            $empleado = Empleado::where('user_id', $reparacion->tecnico_id)->first();
        }

        $porcentaje = (float) ($reparacion->comision_tecnico_pct > 0
            ? $reparacion->comision_tecnico_pct
            : ($empleado?->porcentaje_comision_reparacion ?? 0));

        if ($porcentaje <= 0) {
            return [
                'porcentaje' => 0.0,
                'monto' => 0.0,
                'estado' => 'no_aplica',
                'base' => 0.0,
            ];
        }

        $aplicaA = $empleado?->comision_reparacion_aplica_a ?? 'mano_obra';
        $costoTotal = (float) max(
            $reparacion->costo_estimado ?? 0,
            ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
        );

        $base = ($aplicaA === 'total_orden')
            ? $costoTotal
            : ((float) ($reparacion->costo_mano_obra > 0 ? $reparacion->costo_mano_obra : max(0, $costoTotal - ($reparacion->costo_repuestos ?? 0))));

        $monto = round($base * ($porcentaje / 100), 2);

        return [
            'porcentaje' => $porcentaje,
            'monto' => max(0, $monto),
            'estado' => $monto > 0 ? 'pendiente' : 'no_aplica',
            'base' => $base,
        ];
    }

    /**
     * Obtener resumen general y listados para el módulo de comisiones (Ventas + Reparaciones de Taller).
     */
    public function getCommissionsDashboard(array $filters, int $empresaId, ?int $sucursalId = null): array
    {
        // ── 1. QUERY DE VENTAS ──────────────────────────────────────────────────
        $salesQuery = Sale::query()
            ->where('empresa_id', $empresaId)
            ->whereNotNull('empleado_id')
            ->where('estado', '!=', 'cancelada');

        if (!empty($sucursalId) && $sucursalId !== 'all') {
            $salesQuery->where('sucursal_id', (int) $sucursalId);
        }

        if (!empty($filters['empleado_id']) && $filters['empleado_id'] !== 'all') {
            $salesQuery->where('empleado_id', (int) $filters['empleado_id']);
        }

        if (!empty($filters['estado']) && $filters['estado'] !== 'all') {
            $salesQuery->where('comision_estado', $filters['estado']);
        }

        if (!empty($filters['from'])) {
            $salesQuery->whereDate('created_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $salesQuery->whereDate('created_at', '<=', $filters['to']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $salesQuery->where(function ($q) use ($search) {
                $q->where('codigo_ticket', 'like', "%{$search}%")
                    ->orWhere('cliente_nombre', 'like', "%{$search}%")
                    ->orWhereHas('empleado', function ($eq) use ($search) {
                        $eq->where('nombres', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%")
                            ->orWhere('documento_numero', 'like', "%{$search}%");
                    });
            });
        }

        // Métricas de ventas
        $salesStatsClone = clone $salesQuery;
        $totalVentasMonto = (float) ((clone $salesStatsClone)->sum('total') ?? 0);
        $totalComisionesVentas = (float) ((clone $salesStatsClone)->sum('comision_monto') ?? 0);
        $comisionesVentasPendientes = (float) ((clone $salesStatsClone)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
        $comisionesVentasPagadas = (float) ((clone $salesStatsClone)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);
        $cantidadVentas = (clone $salesStatsClone)->count();

        // Ventas detalladas paginadas
        $ventas = $salesQuery->with(['empleado', 'sucursal', 'comisionPago'])
            ->orderBy('created_at', 'desc')
            ->paginate($filters['perPage'] ?? 15, ['*'], 'page_ventas')
            ->withQueryString();

        // ── 2. QUERY DE REPARACIONES DE TALLER ─────────────────────────────────
        $reparacionesQuery = OrdenReparacion::query()
            ->where('empresa_id', $empresaId)
            ->where(function ($q) {
                $q->whereNotNull('empleado_id')
                    ->orWhereNotNull('tecnico_id');
            })
            ->where('estado_orden', '!=', 'cancelado')
            ->whereIn('estado_orden', ['reparado', 'listo_reparado', 'entregado', 'entregado_finalizado', 'entregado_reparado']);

        if (!empty($sucursalId) && $sucursalId !== 'all') {
            $reparacionesQuery->where('sucursal_id', (int) $sucursalId);
        }

        if (!empty($filters['empleado_id']) && $filters['empleado_id'] !== 'all') {
            $targetEmpleado = Empleado::find($filters['empleado_id']);
            $reparacionesQuery->where(function ($q) use ($filters, $targetEmpleado) {
                $q->where('empleado_id', (int) $filters['empleado_id']);
                if ($targetEmpleado?->user_id) {
                    $q->orWhere('tecnico_id', $targetEmpleado->user_id);
                }
            });
        }

        if (!empty($filters['estado']) && $filters['estado'] !== 'all') {
            $reparacionesQuery->where('comision_estado', $filters['estado']);
        }

        if (!empty($filters['from'])) {
            $reparacionesQuery->whereDate('created_at', '>=', $filters['from']);
        }

        if (!empty($filters['to'])) {
            $reparacionesQuery->whereDate('created_at', '<=', $filters['to']);
        }

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $reparacionesQuery->where(function ($q) use ($search) {
                $q->where('numero_orden', 'like', "%{$search}%")
                    ->orWhere('cliente_nombre', 'like', "%{$search}%")
                    ->orWhereHas('empleado', function ($eq) use ($search) {
                        $eq->where('nombres', 'like', "%{$search}%")
                            ->orWhere('apellidos', 'like', "%{$search}%")
                            ->orWhere('documento_numero', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tecnico', function ($tq) use ($search) {
                        $tq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Métricas de reparaciones
        $repStatsClone = clone $reparacionesQuery;
        $totalReparacionesMonto = (float) ((clone $repStatsClone)->sum('costo_estimado') ?? 0);
        $totalComisionesReparaciones = (float) ((clone $repStatsClone)->sum('comision_monto') ?? 0);
        $comisionesReparacionesPendientes = (float) ((clone $repStatsClone)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
        $comisionesReparacionesPagadas = (float) ((clone $repStatsClone)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);
        $cantidadReparaciones = (clone $repStatsClone)->count();

        // Conteo semáforo de taller para el período y empleado filtrado (Espejo de la hoja de cálculo)
        $tallerBaseScope = OrdenReparacion::query()
            ->where('empresa_id', $empresaId);

        if (!empty($sucursalId) && $sucursalId !== 'all') {
            $tallerBaseScope->where('sucursal_id', (int) $sucursalId);
        }

        if (!empty($filters['empleado_id']) && $filters['empleado_id'] !== 'all') {
            $targetEmp = Empleado::find($filters['empleado_id']);
            $tallerBaseScope->where(function ($q) use ($filters, $targetEmp) {
                $q->where('empleado_id', (int) $filters['empleado_id']);
                if ($targetEmp?->user_id) {
                    $q->orWhere('tecnico_id', $targetEmp->user_id);
                }
            });
        }

        if (!empty($filters['from'])) {
            $tallerBaseScope->whereDate('created_at', '>=', $filters['from']);
        }
        if (!empty($filters['to'])) {
            $tallerBaseScope->whereDate('created_at', '<=', $filters['to']);
        }

        $countReparados = (clone $tallerBaseScope)->whereIn('estado_orden', ['entregado_reparado', 'entregado_finalizado', 'listo_reparado', 'reparado'])->count();
        $countNoReparados = (clone $tallerBaseScope)->whereIn('estado_orden', ['entregado_no_reparado', 'listo_sin_solucion', 'cancelado'])->count();
        $countEnProceso = (clone $tallerBaseScope)->whereIn('estado_orden', ['recibido', 'en_diagnostico_presupuesto', 'confirmacion_presupuesto', 'espera_refaccion', 'en_reparacion', 'en_diagnostico', 'presupuestado', 'esperando_repuesto'])->count();
        $totalTallerEquipos = $countReparados + $countNoReparados + $countEnProceso;
        $pctEfectivoComision = $totalReparacionesMonto > 0 ? round(($totalComisionesReparaciones / $totalReparacionesMonto) * 100, 2) : 0.0;

        // Reparaciones detalladas paginadas
        $reparaciones = $reparacionesQuery->with(['empleado', 'tecnico', 'sucursal', 'comisionPago', 'marca', 'modelo'])
            ->orderBy('created_at', 'desc')
            ->paginate($filters['perPage'] ?? 15, ['*'], 'page_reparaciones')
            ->withQueryString();

        // ── 3. RESUMEN ACUMULADO POR EMPLEADO (VENTAS + REPARACIONES) ────────
        $empleadosResumenQuery = Empleado::query()
            ->where('empresa_id', $empresaId)
            ->when($sucursalId && $sucursalId !== 'all', fn ($q) => $q->where('sucursal_id', (int) $sucursalId))
            ->with(['sucursal', 'user']);

        $empleados = $empleadosResumenQuery->get()->map(function (Empleado $emp) use ($filters) {
            // Ventas POS del empleado
            $sq = Sale::query()
                ->where('empleado_id', $emp->id)
                ->where('estado', '!=', 'cancelada');

            if (!empty($filters['from'])) {
                $sq->whereDate('created_at', '>=', $filters['from']);
            }
            if (!empty($filters['to'])) {
                $sq->whereDate('created_at', '<=', $filters['to']);
            }

            $ventasTotales = (float) ((clone $sq)->sum('total') ?? 0);
            $cantidadVentas = (clone $sq)->count();
            $comisionVentas = (float) ((clone $sq)->sum('comision_monto') ?? 0);
            $comisionVentasPendiente = (float) ((clone $sq)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $comisionVentasPagada = (float) ((clone $sq)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            // Reparaciones del técnico / empleado
            $rq = OrdenReparacion::query()
                ->where(function ($q) use ($emp) {
                    $q->where('empleado_id', $emp->id);
                    if ($emp->user_id) {
                        $q->orWhere('tecnico_id', $emp->user_id);
                    }
                })
                ->where('estado_orden', '!=', 'cancelado')
                ->whereIn('estado_orden', ['reparado', 'listo_reparado', 'entregado', 'entregado_finalizado', 'entregado_reparado']);

            if (!empty($filters['from'])) {
                $rq->whereDate('created_at', '>=', $filters['from']);
            }
            if (!empty($filters['to'])) {
                $rq->whereDate('created_at', '<=', $filters['to']);
            }

            $reparacionesTotales = (float) ((clone $rq)->sum('costo_estimado') ?? 0);
            $cantidadReparaciones = (clone $rq)->count();
            $comisionReparaciones = (float) ((clone $rq)->sum('comision_monto') ?? 0);
            $comisionReparacionesPendiente = (float) ((clone $rq)->where('comision_estado', 'pendiente')->sum('comision_monto') ?? 0);
            $comisionReparacionesPagada = (float) ((clone $rq)->where('comision_estado', 'pagada')->sum('comision_monto') ?? 0);

            $totalComisionesGeneradas = $comisionVentas + $comisionReparaciones;
            $totalPendientes = $comisionVentasPendiente + $comisionReparacionesPendiente;
            $totalPagadas = $comisionVentasPagada + $comisionReparacionesPagada;

            return [
                'id' => $emp->id,
                'nombres' => $emp->nombres,
                'apellidos' => $emp->apellidos,
                'nombre_completo' => $emp->nombre_completo,
                'documento_numero' => $emp->documento_numero,
                'cargo' => $emp->cargo,
                'porcentaje_comision' => (float) $emp->porcentaje_comision,
                'porcentaje_comision_reparacion' => (float) $emp->porcentaje_comision_reparacion,
                'sucursal' => $emp->sucursal ? ['id' => $emp->sucursal->id, 'nombre' => $emp->sucursal->nombre] : null,
                'cantidad_ventas' => $cantidadVentas,
                'ventas_totales' => round($ventasTotales, 2),
                'comision_ventas' => round($comisionVentas, 2),
                'cantidad_reparaciones' => $cantidadReparaciones,
                'reparaciones_totales' => round($reparacionesTotales, 2),
                'comision_reparaciones' => round($comisionReparaciones, 2),
                'comisiones_generadas' => round($totalComisionesGeneradas, 2),
                'comisiones_pendientes' => round($totalPendientes, 2),
                'comisiones_pagadas' => round($totalPagadas, 2),
                'tiene_pendientes' => $totalPendientes > 0,
            ];
        });

        // ── 4. HISTORIAL DE PAGOS / LIQUIDACIONES ─────────────────────────────
        $pagosQuery = ComisionPago::query()
            ->where('empresa_id', $empresaId)
            ->when($sucursalId && $sucursalId !== 'all', fn ($q) => $q->where('sucursal_id', (int) $sucursalId))
            ->when(!empty($filters['empleado_id']) && $filters['empleado_id'] !== 'all', fn ($q) => $q->where('empleado_id', (int) $filters['empleado_id']))
            ->with(['empleado', 'sucursal', 'user'])
            ->orderBy('fecha_pago', 'desc')
            ->limit(25)
            ->get();

        return [
            'stats' => [
                'total_comisiones_generadas' => round($totalComisionesVentas + $totalComisionesReparaciones, 2),
                'comisiones_pendientes' => round($comisionesVentasPendientes + $comisionesReparacionesPendientes, 2),
                'comisiones_pagadas' => round($comisionesVentasPagadas + $comisionesReparacionesPagadas, 2),
                'total_ventas_monto' => round($totalVentasMonto, 2),
                'comisiones_ventas' => round($totalComisionesVentas, 2),
                'cantidad_ventas' => $cantidadVentas,
                'total_reparaciones_monto' => round($totalReparacionesMonto, 2),
                'comisiones_reparaciones' => round($totalComisionesReparaciones, 2),
                'cantidad_reparaciones' => $cantidadReparaciones,
                'taller_semaforo' => [
                    'reparados' => $countReparados,
                    'no_reparados' => $countNoReparados,
                    'en_proceso' => $countEnProceso,
                    'total' => $totalTallerEquipos,
                    'total_generado' => round($totalReparacionesMonto, 2),
                    'total_comisiones' => round($totalComisionesReparaciones, 2),
                    'pct_efectivo' => $pctEfectivoComision,
                ],
            ],
            'empleados_resumen' => $empleados,
            'ventas' => $ventas,
            'reparaciones' => $reparaciones,
            'pagos_recientes' => $pagosQuery,
        ];
    }

    /**
     * Obtener las ventas y reparaciones con comisiones pendientes de un empleado específico.
     */
    public function getPendingItemsForEmployee(Empleado $empleado): array
    {
        $sales = Sale::query()
            ->where('empleado_id', $empleado->id)
            ->where('comision_estado', 'pendiente')
            ->where('comision_monto', '>', 0)
            ->where('estado', '!=', 'cancelada')
            ->orderBy('created_at', 'asc')
            ->get([
                'id',
                'codigo_ticket',
                'cliente_nombre',
                'subtotal',
                'total',
                'comision_porcentaje',
                'comision_monto',
                'created_at',
            ]);

        $repairs = OrdenReparacion::query()
            ->where(function ($q) use ($empleado) {
                $q->where('empleado_id', $empleado->id);
                if ($empleado->user_id) {
                    $q->orWhere('tecnico_id', $empleado->user_id);
                }
            })
            ->where('comision_estado', 'pendiente')
            ->where('comision_monto', '>', 0)
            ->whereNotIn('estado_orden', ['cancelado', 'listo_sin_solucion', 'entregado_no_reparado'])
            ->orderBy('created_at', 'asc')
            ->get([
                'id',
                'numero_orden',
                'cliente_nombre',
                'tipo_dispositivo',
                'marca_nombre',
                'modelo_nombre',
                'costo_mano_obra',
                'costo_estimado',
                'comision_tecnico_pct',
                'comision_monto',
                'created_at',
            ]);

        return [
            'ventas' => $sales,
            'reparaciones' => $repairs,
            'total_pendiente' => round((float) $sales->sum('comision_monto') + (float) $repairs->sum('comision_monto'), 2),
        ];
    }

    /**
     * Procesar liquidación y pago de comisiones acumuladas (Ventas + Reparaciones de Taller).
     * Genera recibo/ticket y opcionalmente movimiento de egreso en caja activa.
     */
    public function liquidateCommissions(
        Empleado $empleado,
        array $saleIds = [],
        array $reparacionIds = [],
        string $metodoPago = 'efectivo',
        ?int $cashRegisterId = null,
        ?string $notas = null,
        ?int $userId = null,
        bool $registrarEgresoCaja = true
    ): ComisionPago {
        return DB::transaction(function () use (
            $empleado,
            $saleIds,
            $reparacionIds,
            $metodoPago,
            $cashRegisterId,
            $notas,
            $userId,
            $registrarEgresoCaja
        ) {
            // 1. Obtener ventas seleccionadas
            $sales = collect();
            if (!empty($saleIds)) {
                $sales = Sale::query()
                    ->where('empleado_id', $empleado->id)
                    ->where('comision_estado', 'pendiente')
                    ->where('comision_monto', '>', 0)
                    ->whereIn('id', $saleIds)
                    ->lockForUpdate()
                    ->get();
            }

            // 2. Obtener reparaciones seleccionadas
            $repairs = collect();
            if (!empty($reparacionIds)) {
                $repairs = OrdenReparacion::query()
                    ->where(function ($q) use ($empleado) {
                        $q->where('empleado_id', $empleado->id);
                        if ($empleado->user_id) {
                            $q->orWhere('tecnico_id', $empleado->user_id);
                        }
                    })
                    ->where('comision_estado', 'pendiente')
                    ->where('comision_monto', '>', 0)
                    ->whereIn('id', $reparacionIds)
                    ->lockForUpdate()
                    ->get();
            }

            if ($sales->isEmpty() && $repairs->isEmpty()) {
                throw new InvalidArgumentException(__('No hay comisiones de ventas o reparaciones seleccionadas para este colaborador.'));
            }

            $montoVentas = (float) $sales->sum('comision_monto');
            $montoReparaciones = (float) $repairs->sum('comision_monto');
            $montoTotal = round($montoVentas + $montoReparaciones, 2);

            $totalVentasBase = round((float) $sales->sum('total'), 2);
            $cantidadVentas = $sales->count();

            $totalReparacionesBase = round((float) $repairs->sum('costo_estimado'), 2);
            $cantidadReparaciones = $repairs->count();

            // Determinar periodo
            $allDates = $sales->pluck('created_at')->concat($repairs->pluck('created_at'))->filter();
            $periodoDesde = $allDates->min() ? Carbon::parse($allDates->min())->toDateString() : null;
            $periodoHasta = $allDates->max() ? Carbon::parse($allDates->max())->toDateString() : null;

            // Generar código consecutivo de recibo de comisión
            $empresaId = $empleado->empresa_id;
            $sucursalId = $empleado->sucursal_id ?? 1;

            $lastPago = ComisionPago::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->orderByDesc('id')
                ->first();

            $nextNum = 1;
            if ($lastPago && preg_match('/REC-COM-(\d+)/', $lastPago->codigo_recibo, $m)) {
                $nextNum = ((int) $m[1]) + 1;
            }
            $codigoRecibo = 'REC-COM-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

            while (ComisionPago::withoutGlobalScopes()
                ->where('empresa_id', $empresaId)
                ->where('codigo_recibo', $codigoRecibo)
                ->exists()) {
                $nextNum++;
                $codigoRecibo = 'REC-COM-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);
            }

            // Crear el registro de pago / liquidación
            $comisionPago = ComisionPago::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'empleado_id' => $empleado->id,
                'user_id' => $userId,
                'cash_register_id' => $cashRegisterId,
                'codigo_recibo' => $codigoRecibo,
                'monto_total' => $montoTotal,
                'total_ventas_base' => $totalVentasBase,
                'cantidad_ventas' => $cantidadVentas,
                'total_reparaciones_base' => $totalReparacionesBase,
                'cantidad_reparaciones' => $cantidadReparaciones,
                'metodo_pago' => $metodoPago,
                'fecha_pago' => now(),
                'periodo_desde' => $periodoDesde,
                'periodo_hasta' => $periodoHasta,
                'notas' => $notas,
            ]);

            // Marcar las ventas asociadas como pagadas y vincular al pago
            if ($sales->isNotEmpty()) {
                Sale::whereIn('id', $sales->pluck('id'))->update([
                    'comision_estado' => 'pagada',
                    'comision_pago_id' => $comisionPago->id,
                ]);
            }

            // Marcar las reparaciones asociadas como pagadas y vincular al pago
            if ($repairs->isNotEmpty()) {
                OrdenReparacion::whereIn('id', $repairs->pluck('id'))->update([
                    'comision_estado' => 'pagada',
                    'comision_pago_id' => $comisionPago->id,
                    'empleado_id' => $empleado->id,
                ]);
            }

            // Si se especificó caja registradora y el método es en efectivo, registrar egreso en caja
            if ($registrarEgresoCaja && $cashRegisterId && in_array(strtolower($metodoPago), ['efectivo', 'dolar', 'cash'])) {
                $cashRegister = CashRegister::find($cashRegisterId);
                if ($cashRegister && $cashRegister->status === 'open') {
                    $conceptos = [];
                    if ($cantidadVentas > 0) $conceptos[] = "{$cantidadVentas} ventas";
                    if ($cantidadReparaciones > 0) $conceptos[] = "{$cantidadReparaciones} reparaciones";
                    $conceptosStr = implode(' y ', $conceptos);

                    CashMovement::create([
                        'cash_register_id' => $cashRegister->id,
                        'empresa_id' => $empresaId,
                        'sucursal_id' => $sucursalId,
                        'type' => 'egreso',
                        'concepto' => 'pago_comision',
                        'metodo_pago' => $metodoPago,
                        'amount' => $montoTotal,
                        'description' => "Liquidación Comisiones {$codigoRecibo} - Colaborador: {$empleado->nombre_completo} ({$conceptosStr})",
                        'created_by' => $userId,
                    ]);
                }
            }

            return $comisionPago->fresh(['empleado', 'sucursal', 'user', 'sales', 'reparaciones']);
        });
    }

    /**
     * Formatear los datos de un pago para el ticket de comprobante de liquidación.
     */
    public function getTicketData(ComisionPago $pago): array
    {
        $pago->loadMissing(['empleado', 'sucursal', 'empresa', 'user', 'sales', 'reparaciones.marca', 'reparaciones.modelo']);

        $empresa = $pago->empresa;
        $sucursal = $pago->sucursal;
        $empleado = $pago->empleado;

        return [
            'id' => $pago->id,
            'codigo_recibo' => $pago->codigo_recibo,
            'fecha_pago' => $pago->fecha_pago?->format('d/m/Y H:i'),
            'monto_total' => (float) $pago->monto_total,
            'total_ventas_base' => (float) $pago->total_ventas_base,
            'cantidad_ventas' => (int) $pago->cantidad_ventas,
            'total_reparaciones_base' => (float) ($pago->total_reparaciones_base ?? 0),
            'cantidad_reparaciones' => (int) ($pago->cantidad_reparaciones ?? 0),
            'metodo_pago' => $pago->metodo_pago,
            'periodo_desde' => $pago->periodo_desde?->format('d/m/Y'),
            'periodo_hasta' => $pago->periodo_hasta?->format('d/m/Y'),
            'notas' => $pago->notas,
            'empleado' => [
                'id' => $empleado?->id,
                'nombre_completo' => $empleado?->nombre_completo,
                'documento_tipo' => $empleado?->documento_tipo,
                'documento_numero' => $empleado?->documento_numero,
                'cargo' => $empleado?->cargo,
                'porcentaje_comision' => (float) $empleado?->porcentaje_comision,
                'porcentaje_comision_reparacion' => (float) $empleado?->porcentaje_comision_reparacion,
            ],
            'empresa' => [
                'razon_social' => $empresa?->razon_social ?? $empresa?->nombre ?? 'FixSale POS',
                'documento' => $empresa?->documento,
                'direccion' => $empresa?->direccion,
                'telefono' => $empresa?->telefono,
                'email' => $empresa?->email,
                'logo' => $empresa?->logo,
            ],
            'sucursal' => [
                'nombre' => $sucursal?->nombre,
                'direccion' => $sucursal?->direccion,
                'telefono' => $sucursal?->telefono,
            ],
            'cajero' => [
                'id' => $pago->user?->id,
                'name' => $pago->user?->name ?? 'Administración',
            ],
            'ventas_liquidadas' => $pago->sales->map(fn (Sale $s) => [
                'id' => $s->id,
                'codigo_ticket' => $s->codigo_ticket,
                'fecha' => $s->created_at?->format('d/m/Y H:i'),
                'total' => (float) $s->total,
                'comision_porcentaje' => (float) $s->comision_porcentaje,
                'comision_monto' => (float) $s->comision_monto,
            ]),
            'reparaciones_liquidadas' => $pago->reparaciones->map(fn (OrdenReparacion $r) => [
                'id' => $r->id,
                'numero_orden' => $r->numero_orden,
                'dispositivo' => trim("{$r->tipo_dispositivo} {$r->marca_nombre} {$r->modelo_nombre}"),
                'fecha' => $r->created_at?->format('d/m/Y H:i'),
                'costo' => (float) $r->costo_estimado,
                'comision_porcentaje' => (float) $r->comision_tecnico_pct,
                'comision_monto' => (float) $r->comision_monto,
            ]),
        ];
    }
}
