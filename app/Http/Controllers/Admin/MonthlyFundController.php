<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\CierreMensual;
use App\Models\Compra;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MonthlyFundController extends Controller
{
    protected function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (! $user) {
            return '$';
        }

        $empresa = $user->empresa;
        if (! $empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && ! empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $selectedYear = (int) ($request->year ?? date('Y'));
        $selectedMonth = (int) ($request->month ?? date('n'));
        $selectedSucursal = $request->sucursal_id ?? 'all';

        // Obtener sucursales activas de la empresa (Multitenantable las filtra automáticamente)
        $sucursales = Sucursal::where('status', true)->select('id', 'nombre')->get();

        // 1. Cajas Cerradas en el mes actual filtrado
        $cajasCerradasQuery = CashRegister::where('status', 'closed')
            ->whereYear('closed_at', $selectedYear)
            ->whereMonth('closed_at', $selectedMonth);

        if ($selectedSucursal !== 'all') {
            $cajasCerradasQuery->where('sucursal_id', $selectedSucursal);
        }

        $cajasCerradas = $cajasCerradasQuery->with(['user', 'sucursal'])->get();
        $cajaIds = $cajasCerradas->pluck('id');

        // Acumulado de movimientos de las cajas cerradas del mes
        $inflows = (float) CashMovement::whereIn('cash_register_id', $cajaIds)
            ->where('type', 'inflow')
            ->sum('amount');

        $outflows = (float) CashMovement::whereIn('cash_register_id', $cajaIds)
            ->where('type', 'outflow')
            ->sum('amount');

        $fondosAperturaSum = (float) $cajasCerradas->sum('opening_amount');
        $saldoNetoMes = $inflows - $outflows;

        // 2. Comprobar si el mes ya cuenta con Cierre Guardado
        $cierreSnapshotQuery = CierreMensual::where('year', $selectedYear)
            ->where('month', $selectedMonth);

        if ($selectedSucursal !== 'all') {
            $cierreSnapshotQuery->where('sucursal_id', $selectedSucursal);
        } else {
            $cierreSnapshotQuery->whereNull('sucursal_id');
        }

        $cierreSnapshot = $cierreSnapshotQuery->first();

        // 2b. Total de compras que usaron fondo en el período seleccionado
        $fondosUsadosQuery = Compra::where('usar_fondo_mes', true)
            ->where('status', '!=', 'anulada')
            ->whereHas('cierreMensual', function ($q) use ($selectedYear, $selectedMonth, $selectedSucursal) {
                $q->where('year', $selectedYear)->where('month', $selectedMonth);
                if ($selectedSucursal !== 'all') {
                    $q->where('sucursal_id', $selectedSucursal);
                }
            });

        $totalFondosUsados = (float) $fondosUsadosQuery->sum('total');
        $saldoRealDisponible = $saldoNetoMes - $totalFondosUsados;

        // 3. Generar Datos para ApexChart 1: Evolución Anual Enero a Diciembre
        $monthsName = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $annualInflows = [];
        $annualOutflows = [];
        $annualNet = [];

        for ($m = 1; $m <= 12; $m++) {
            $mCajasQuery = CashRegister::where('status', 'closed')
                ->whereYear('closed_at', $selectedYear)
                ->whereMonth('closed_at', $m);

            if ($selectedSucursal !== 'all') {
                $mCajasQuery->where('sucursal_id', $selectedSucursal);
            }

            $mCajaIds = $mCajasQuery->pluck('id');

            $mIn = (float) CashMovement::whereIn('cash_register_id', $mCajaIds)->where('type', 'inflow')->sum('amount');
            $mOut = (float) CashMovement::whereIn('cash_register_id', $mCajaIds)->where('type', 'outflow')->sum('amount');
            $mNet = $mIn - $mOut;

            $annualInflows[] = round($mIn, 2);
            $annualOutflows[] = round($mOut, 2);
            $annualNet[] = round($mNet, 2);
        }

        // 4. Generar Datos para ApexChart 2: Desglose por Forma de Pago en Cajas Cerradas
        $breakdownRows = CashMovement::whereIn('cash_register_id', $cajaIds)
            ->selectRaw('metodo_pago, SUM(CASE WHEN type = "inflow" THEN amount ELSE -amount END) as total')
            ->groupBy('metodo_pago')
            ->get();

        $paymentLabels = [];
        $paymentSeries = [];

        foreach ($breakdownRows as $row) {
            $label = ucfirst($row->metodo_pago);
            if ($row->metodo_pago === 'efectivo') $label = 'Efectivo';
            if ($row->metodo_pago === 'dolar') $label = 'Dólares (USD)';
            if ($row->metodo_pago === 'transferencia') $label = 'Transferencia';
            if ($row->metodo_pago === 'tarjeta') $label = 'Tarjeta';

            $paymentLabels[] = $label;
            $paymentSeries[] = max(0, round((float) $row->total, 2));
        }

        // 5. Comparativa con Mes Anterior
        $prevMonth = $selectedMonth === 1 ? 12 : $selectedMonth - 1;
        $prevYear = $selectedMonth === 1 ? $selectedYear - 1 : $selectedYear;

        $prevCajasQuery = CashRegister::where('status', 'closed')
            ->whereYear('closed_at', $prevYear)
            ->whereMonth('closed_at', $prevMonth);

        if ($selectedSucursal !== 'all') {
            $prevCajasQuery->where('sucursal_id', $selectedSucursal);
        }

        $prevCajaIds = $prevCajasQuery->pluck('id');
        $prevIn = (float) CashMovement::whereIn('cash_register_id', $prevCajaIds)->where('type', 'inflow')->sum('amount');
        $prevOut = (float) CashMovement::whereIn('cash_register_id', $prevCajaIds)->where('type', 'outflow')->sum('amount');
        $prevNet = $prevIn - $prevOut;

        $percentageChange = $prevNet > 0 ? (($saldoNetoMes - $prevNet) / $prevNet) * 100 : 0;

        // 6. Histórico de Cierres Mensuales Guardados
        $cierresHistoricosQuery = CierreMensual::with(['user', 'sucursal'])
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc');

        if ($selectedSucursal !== 'all') {
            $cierresHistoricosQuery->where('sucursal_id', $selectedSucursal);
        }

        $cierresHistoricos = $cierresHistoricosQuery
            ->withCount(['compras' => fn ($q) => $q->where('status', '!=', 'anulada')])
            ->with([
                'user',
                'sucursal',
                'compras' => fn ($q) => $q
                    ->with([
                        'proveedor:id,razon_social',
                        'pagos:id,compra_id,metodo_pago',
                    ])
                    ->select('id', 'cierre_mensual_id', 'codigo_compra', 'proveedor_id', 'total', 'tipo_pago', 'fecha_emision', 'status')
                    ->where('status', '!=', 'anulada')
                    ->orderBy('created_at', 'desc'),
            ])
            ->get();

        return inertia('admin/FondoMensual/Index', [
            'sucursales' => $sucursales,
            'selectedYear' => $selectedYear,
            'selectedMonth' => $selectedMonth,
            'selectedSucursal' => $selectedSucursal,
            'currencySymbol' => $this->getCurrencySymbol(),

            'currentMonthStats' => [
                'cajas_cerradas_cant' => $cajasCerradas->count(),
                'inflows'             => $inflows,
                'outflows'            => $outflows,
                'saldo_neto'          => $saldoNetoMes,
                'saldo_real'          => $saldoRealDisponible,
                'total_fondos_usados' => $totalFondosUsados,
                'fondos_apertura'     => $fondosAperturaSum,
                'prev_month_net'      => $prevNet,
                'percentage_change'   => round($percentageChange, 1),
                'is_closed'           => (bool) ($cierreSnapshot && $cierreSnapshot->status === 'cerrado'),
                'snapshot'            => $cierreSnapshot,
            ],

            'annualChartData' => [
                'categories' => $monthsName,
                'inflows' => $annualInflows,
                'outflows' => $annualOutflows,
                'net' => $annualNet,
            ],

            'paymentChartData' => [
                'labels' => $paymentLabels,
                'series' => $paymentSeries,
            ],

            'cierresHistoricos' => $cierresHistoricos,
        ]);
    }

    public function closeMonth(Request $request)
    {
        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|between:1,12',
            'sucursal_id' => 'nullable|string',
            'fondo_siguiente_mes' => 'required|numeric|min:0',
            'retiro_utilidad' => 'nullable|numeric|min:0',
            'notas' => 'nullable|string',
        ]);

        $user = auth()->user();
        $sucursalId = ($validated['sucursal_id'] && $validated['sucursal_id'] !== 'all') ? (int) $validated['sucursal_id'] : null;

        // Calcular totales exactos de cajas cerradas
        $cajasQuery = CashRegister::where('status', 'closed')
            ->whereYear('closed_at', $validated['year'])
            ->whereMonth('closed_at', $validated['month']);

        if ($sucursalId) {
            $cajasQuery->where('sucursal_id', $sucursalId);
        }

        $cajaIds = $cajasQuery->pluck('id');

        $inflows = (float) CashMovement::whereIn('cash_register_id', $cajaIds)->where('type', 'inflow')->sum('amount');
        $outflows = (float) CashMovement::whereIn('cash_register_id', $cajaIds)->where('type', 'outflow')->sum('amount');
        $saldoNeto = $inflows - $outflows;

        $cierre = CierreMensual::updateOrCreate(
            [
                'empresa_id' => $user->empresa_id,
                'sucursal_id' => $sucursalId,
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            [
                'user_id' => $user->id,
                'fecha_cierre' => now(),
                'total_ingresos' => $inflows,
                'total_egresos' => $outflows,
                'saldo_neto' => $saldoNeto,
                'fondo_siguiente_mes' => (float) $validated['fondo_siguiente_mes'],
                'retiro_utilidad' => (float) ($validated['retiro_utilidad'] ?? 0),
                'status' => 'cerrado',
                'notas' => $validated['notas'] ?? null,
            ]
        );

        return back()->with('success', "Cierre del mes {$validated['month']}/{$validated['year']} ejecutado exitosamente.");
    }
}
