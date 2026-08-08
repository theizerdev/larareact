<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nomina;
use App\Models\NominaDetalle;
use App\Models\OrdenReparacion;
use App\Models\Sucursal;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NominaController extends Controller
{
    public function index(Request $request)
    {
        $selectedFormatoPago = (string) $request->input('formato_pago', 'mensual');
        $selectedFechaReferencia = (string) $request->input('fecha_referencia', now()->toDateString());
        $selectedSucursal = $request->input('sucursal_id', 'all');

        [$periodoInicio, $periodoFin, $selectedYear, $selectedMonth] = $this->resolvePeriod($selectedFormatoPago, $selectedFechaReferencia);

        $sucursales = Sucursal::where('status', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        $nominaQuery = Nomina::with([
            'detalles.user.roles:id,name',
            'sucursal:id,nombre',
            'user:id,name',
        ])
            ->where('year', $selectedYear)
            ->where('month', $selectedMonth)
            ->where('formato_pago', $selectedFormatoPago)
            ->whereDate('periodo_inicio', $periodoInicio)
            ->whereDate('periodo_fin', $periodoFin);

        if ($selectedSucursal !== 'all') {
            $nominaQuery->where('sucursal_id', (int) $selectedSucursal);
        } else {
            $nominaQuery->whereNull('sucursal_id');
        }

        $nomina = $nominaQuery->first();

        $eligibleUsersQuery = User::query()
            ->with(['roles:id,name'])
            ->where('status', 'activo')
            ->whereNotNull('sueldo_base')
            ->where('sueldo_base', '>', 0)
            ->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['Administrador', 'Super Administrador', 'super-admin', 'Super Admin']);
            });

        if ($selectedSucursal !== 'all') {
            $eligibleUsersQuery->where('sucursal_id', (int) $selectedSucursal);
        }

        $eligibleUsers = $eligibleUsersQuery
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'sueldo_base', 'sucursal_id']);

        return inertia('admin/Nomina/Index', [
            'sucursales' => $sucursales,
            'selectedYear' => $selectedYear,
            'selectedMonth' => $selectedMonth,
            'selectedFormatoPago' => $selectedFormatoPago,
            'selectedFechaReferencia' => $selectedFechaReferencia,
            'periodoInicio' => $periodoInicio,
            'periodoFin' => $periodoFin,
            'selectedSucursal' => (string) $selectedSucursal,
            'nomina' => $nomina,
            'eligibleUsers' => $eligibleUsers,
        ]);
    }

    public function generar(Request $request)
    {
        $validated = $request->validate([
            'formato_pago' => ['required', 'in:diaria,semanal,quincenal,mensual'],
            'fecha_referencia' => ['required', 'date'],
            'sucursal_id' => ['nullable'],
        ]);

        $user = auth()->user();
        [$periodoInicio, $periodoFin, $periodoYear, $periodoMonth] = $this->resolvePeriod($validated['formato_pago'], $validated['fecha_referencia']);
        $sucursalId = ($validated['sucursal_id'] ?? 'all') !== 'all'
            ? (int) $validated['sucursal_id']
            : null;

        $eligibleUsersQuery = User::query()
            ->with(['roles:id,name'])
            ->where('status', 'activo')
            ->whereNotNull('sueldo_base')
            ->where('sueldo_base', '>', 0)
            ->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['Administrador', 'Super Administrador', 'super-admin', 'Super Admin']);
            });

        if ($sucursalId) {
            $eligibleUsersQuery->where('sucursal_id', $sucursalId);
        }

        $eligibleUsers = $eligibleUsersQuery
            ->orderBy('name')
            ->get(['id', 'name', 'sueldo_base']);

        if ($eligibleUsers->isEmpty()) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('No hay empleados elegibles para generar nómina en el período seleccionado.'),
            ]);
        }

        DB::transaction(function () use ($validated, $sucursalId, $user, $eligibleUsers, $periodoInicio, $periodoFin, $periodoYear, $periodoMonth) {
            $nomina = Nomina::query()
            ->where('year', $periodoYear)
            ->where('month', $periodoMonth)
            ->where('formato_pago', $validated['formato_pago'])
            ->whereDate('periodo_inicio', $periodoInicio)
            ->whereDate('periodo_fin', $periodoFin)
                ->when($sucursalId, fn ($q) => $q->where('sucursal_id', $sucursalId), fn ($q) => $q->whereNull('sucursal_id'))
                ->first();

            if ($nomina && $nomina->estado !== 'borrador') {
                abort(422, __('La nómina ya fue cerrada o pagada y no puede regenerarse.'));
            }

            if (! $nomina) {
                $nomina = Nomina::create([
                    'empresa_id' => $user?->empresa_id,
                    'sucursal_id' => $sucursalId,
                    'user_id' => $user?->id,
                    'year' => $periodoYear,
                    'month' => $periodoMonth,
                    'formato_pago' => $validated['formato_pago'],
                    'periodo_inicio' => $periodoInicio,
                    'periodo_fin' => $periodoFin,
                    'estado' => 'borrador',
                ]);
            }

            $nomina->detalles()->delete();

            $metricasReparacionPorTecnico = $this->calcularMetricasReparacionesPorTecnico(
                $eligibleUsers->pluck('id')->all(),
                $periodoInicio,
                $periodoFin,
                $user?->empresa_id
            );

            $totalBruto = 0.0;
            $totalComisionReparaciones = 0.0;
            foreach ($eligibleUsers as $empleado) {
                $sueldo = (float) $empleado->sueldo_base;
                $rolNombre = (string) optional($empleado->roles->first())->name;
                $metrica = $metricasReparacionPorTecnico[$empleado->id] ?? [
                    'monto_pagado_reparaciones_periodo' => 0.0,
                    'comision_reparaciones' => 0.0,
                    'reparaciones_reparadas_periodo' => 0,
                ];

                $comisionReparaciones = (float) ($metrica['comision_reparaciones'] ?? 0);
                $montoPagadoReparaciones = (float) ($metrica['monto_pagado_reparaciones_periodo'] ?? 0);
                $reparacionesReparadas = (int) ($metrica['reparaciones_reparadas_periodo'] ?? 0);

                $totalNeto = max(0, $sueldo + $comisionReparaciones);

                NominaDetalle::create([
                    'nomina_id' => $nomina->id,
                    'user_id' => $empleado->id,
                    'rol_nombre' => $rolNombre,
                    'sueldo_base_snapshot' => $sueldo,
                    'bonos' => 0,
                    'descuentos' => 0,
                    'comision_reparaciones' => $comisionReparaciones,
                    'monto_pagado_reparaciones_periodo' => $montoPagadoReparaciones,
                    'reparaciones_reparadas_periodo' => $reparacionesReparadas,
                    'total_neto' => $totalNeto,
                    'estado_pago' => 'pendiente',
                ]);

                $totalBruto += $sueldo;
                $totalComisionReparaciones += $comisionReparaciones;
            }

            $nomina->update([
                'total_bruto' => $totalBruto,
                'total_bonos' => 0,
                'total_descuentos' => 0,
                'total_comision_reparaciones' => $totalComisionReparaciones,
                'total_neto' => (float) $nomina->detalles()->sum('total_neto'),
                'estado' => 'borrador',
                'fecha_cierre' => null,
            ]);
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Nómina generada correctamente.'),
        ]);
    }

    public function updateDetalle(Request $request, NominaDetalle $detalle)
    {
        $validated = $request->validate([
            'bonos' => ['nullable', 'numeric', 'min:0'],
            'descuentos' => ['nullable', 'numeric', 'min:0'],
            'observaciones' => ['nullable', 'string'],
        ]);

        $nomina = $detalle->nomina;
        if (! $nomina || $nomina->estado !== 'borrador') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Solo se pueden editar detalles cuando la nómina está en borrador.'),
            ]);
        }

        $bonos = (float) ($validated['bonos'] ?? $detalle->bonos);
        $descuentos = (float) ($validated['descuentos'] ?? $detalle->descuentos);
        $bruto = (float) $detalle->sueldo_base_snapshot;
        $comisionReparaciones = (float) ($detalle->comision_reparaciones ?? 0);
        $neto = max(0, $bruto + $bonos + $comisionReparaciones - $descuentos);

        $detalle->update([
            'bonos' => $bonos,
            'descuentos' => $descuentos,
            'total_neto' => $neto,
            'observaciones' => $validated['observaciones'] ?? $detalle->observaciones,
        ]);

        $this->recalcularTotalesNomina($nomina->id);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Detalle de nómina actualizado.'),
        ]);
    }

    public function cerrar(Request $request, Nomina $nomina)
    {
        if ($nomina->estado !== 'borrador') {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('La nómina ya está cerrada o pagada.'),
            ]);
        }

        $this->recalcularTotalesNomina($nomina->id);

        $nomina->update([
            'estado' => 'cerrada',
            'fecha_cierre' => now(),
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Nómina cerrada exitosamente.'),
        ]);
    }

    public function pagarDetalle(Request $request, NominaDetalle $detalle)
    {
        $nomina = $detalle->nomina;
        if (! $nomina || ! in_array($nomina->estado, ['cerrada', 'pagada'], true)) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => __('Solo se pueden marcar pagos en nóminas cerradas.'),
            ]);
        }

        $toPaid = $detalle->estado_pago !== 'pagado';

        $detalle->update([
            'estado_pago' => $toPaid ? 'pagado' : 'pendiente',
            'fecha_pago' => $toPaid ? now() : null,
        ]);

        $pending = $nomina->detalles()->where('estado_pago', 'pendiente')->count();
        $nomina->update([
            'estado' => $pending === 0 ? 'pagada' : 'cerrada',
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => $toPaid ? __('Pago marcado correctamente.') : __('Pago revertido correctamente.'),
        ]);
    }

    private function recalcularTotalesNomina(int $nominaId): void
    {
        $totals = NominaDetalle::query()
            ->where('nomina_id', $nominaId)
            ->selectRaw('SUM(sueldo_base_snapshot) as bruto, SUM(bonos) as bonos, SUM(descuentos) as descuentos, SUM(comision_reparaciones) as comisiones_reparaciones, SUM(total_neto) as neto')
            ->first();

        Nomina::query()->where('id', $nominaId)->update([
            'total_bruto' => (float) ($totals->bruto ?? 0),
            'total_bonos' => (float) ($totals->bonos ?? 0),
            'total_descuentos' => (float) ($totals->descuentos ?? 0),
            'total_comision_reparaciones' => (float) ($totals->comisiones_reparaciones ?? 0),
            'total_neto' => (float) ($totals->neto ?? 0),
        ]);
    }

    private function calcularMetricasReparacionesPorTecnico(array $tecnicoIds, string $periodoInicio, string $periodoFin, ?int $empresaId): array
    {
        if (empty($tecnicoIds)) {
            return [];
        }

        $inicio = Carbon::parse($periodoInicio)->startOfDay();
        $fin = Carbon::parse($periodoFin)->endOfDay();

        $reparaciones = OrdenReparacion::query()
            ->with([
                'sale:id,total,monto_recibido,cambio',
                'sale.payments:id,sale_id,monto',
                'sale.creditPayments:id,sale_id,monto',
            ])
            ->whereIn('tecnico_id', $tecnicoIds)
            ->where('estado_orden', 'reparado')
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->whereHas('historial', function ($q) use ($inicio, $fin) {
                $q->where('estado_nuevo', 'reparado')
                    ->whereBetween('created_at', [$inicio, $fin]);
            })
            ->get([
                'id',
                'tecnico_id',
                'comision_tecnico_pct',
                'costo_estimado',
                'anticipo',
                'saldo_restante',
                'sale_id',
            ]);

        $metricas = [];
        foreach ($reparaciones as $reparacion) {
            $tecnicoId = (int) $reparacion->tecnico_id;
            if (! isset($metricas[$tecnicoId])) {
                $metricas[$tecnicoId] = [
                    'monto_pagado_reparaciones_periodo' => 0.0,
                    'comision_reparaciones' => 0.0,
                    'reparaciones_reparadas_periodo' => 0,
                ];
            }

            $montoPagadoCliente = $this->resolverMontoPagadoCliente($reparacion);
            $porcentajeComision = max(0, (float) ($reparacion->comision_tecnico_pct ?? 0));
            $montoComision = round($montoPagadoCliente * ($porcentajeComision / 100), 2);

            $metricas[$tecnicoId]['monto_pagado_reparaciones_periodo'] += $montoPagadoCliente;
            $metricas[$tecnicoId]['comision_reparaciones'] += $montoComision;
            $metricas[$tecnicoId]['reparaciones_reparadas_periodo']++;
        }

        return $metricas;
    }

    private function resolverMontoPagadoCliente(OrdenReparacion $reparacion): float
    {
        if ($reparacion->sale) {
            $sale = $reparacion->sale;
            $totalVenta = (float) ($sale->total ?? 0);
            $montoRecibido = max(0, (float) ($sale->monto_recibido ?? 0) - (float) ($sale->cambio ?? 0));
            $pagosVenta = (float) $sale->payments->sum('monto');
            $pagosCredito = (float) $sale->creditPayments->sum('monto');

            $montoPagado = max($montoRecibido, $pagosVenta) + $pagosCredito;
            if ($totalVenta > 0) {
                $montoPagado = min($montoPagado, $totalVenta);
            }

            return round(max(0, $montoPagado), 2);
        }

        $costoEstimado = (float) ($reparacion->costo_estimado ?? 0);
        $anticipo = (float) ($reparacion->anticipo ?? 0);
        $saldoRestante = (float) ($reparacion->saldo_restante ?? 0);
        $pagadoPorSaldo = max(0, $costoEstimado - $saldoRestante);

        return round(max($anticipo, $pagadoPorSaldo), 2);
    }

    private function resolvePeriod(string $formatoPago, string $fechaReferencia): array
    {
        $reference = Carbon::parse($fechaReferencia)->startOfDay();

        switch ($formatoPago) {
            case 'diaria':
                $start = $reference->copy()->startOfDay();
                $end = $reference->copy()->endOfDay();
                break;
            case 'semanal':
                $start = $reference->copy()->startOfWeek(Carbon::MONDAY)->startOfDay();
                $end = $reference->copy()->endOfWeek(Carbon::SUNDAY)->endOfDay();
                break;
            case 'quincenal':
                if ((int) $reference->day <= 15) {
                    $start = $reference->copy()->startOfMonth()->startOfDay();
                    $end = $reference->copy()->day(15)->endOfDay();
                } else {
                    $start = $reference->copy()->day(16)->startOfDay();
                    $end = $reference->copy()->endOfMonth()->endOfDay();
                }
                break;
            case 'mensual':
            default:
                $start = $reference->copy()->startOfMonth()->startOfDay();
                $end = $reference->copy()->endOfMonth()->endOfDay();
                break;
        }

        return [
            $start->toDateString(),
            $end->toDateString(),
            (int) $start->year,
            (int) $start->month,
        ];
    }
}
