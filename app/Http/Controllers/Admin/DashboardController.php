<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Services\CashRegisterService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request, CashRegisterService $cashService)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::today()->subDays(6)->startOfDay();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();

        $user = auth()->user();
        $empresa = $user?->empresa;
        if (!$empresa && $user?->empresa_id) {
            $empresa = \App\Models\Empresa::find($user->empresa_id);
        }

        $pais = $empresa?->pais ?? ($empresa?->pais_id ? \App\Models\Pais::find($empresa->pais_id) : null);
        $currencySymbol = $pais?->simbolo_moneda ?? '$';
        $currencyCode = $pais?->moneda_principal ?? 'MXN';

        $valorDolar = (float) ($empresa?->valor_dolar ?? 20.0);

        // Active Cash Register of User
        $activeRegister = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        $registerSummary = null;
        if ($activeRegister) {
            $inflows = (float) $activeRegister->movements()->where('type', 'inflow')->sum('amount');
            $outflows = (float) $activeRegister->movements()->where('type', 'outflow')->sum('amount');
            $openingAmount = (float) $activeRegister->opening_amount;
            $expectedBalance = $openingAmount + $inflows - $outflows;

            $registerSummary = [
                'id' => $activeRegister->id,
                'opened_at' => $activeRegister->opened_at,
                'opening_amount' => $openingAmount,
                'inflows' => $inflows,
                'outflows' => $outflows,
                'expected_balance' => $expectedBalance,
                'expected_usd' => $valorDolar > 0 ? $expectedBalance / $valorDolar : 0,
                'by_payment_method' => $cashService->getPaymentMethodBreakdown($activeRegister),
            ];
        }

        // Today's Stats
        $todayStart = Carbon::today()->startOfDay();
        $todayEnd = Carbon::today()->endOfDay();

        $todaySalesQuery = Sale::where('estado', 'completada')
            ->whereBetween('created_at', [$todayStart, $todayEnd]);

        $todayTotalMXN = (float) (clone $todaySalesQuery)->sum('total');
        $todayCount = (clone $todaySalesQuery)->count();
        $todayAverageTicket = $todayCount > 0 ? $todayTotalMXN / $todayCount : 0;

        // Today USD Payments collected
        $todayUSDPaymentsSumMXN = (float) SalePayment::whereHas('sale', function ($q) use ($todayStart, $todayEnd) {
            $q->where('estado', 'completada')->whereBetween('created_at', [$todayStart, $todayEnd]);
        })->where('metodo_pago', 'dolar')->sum('monto');
        $todayTotalUSD = $valorDolar > 0 ? $todayUSDPaymentsSumMXN / $valorDolar : 0;

        // Date Range Sales Query
        $rangeSales = Sale::where('estado', 'completada')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $rangeTotal = (float) $rangeSales->sum('total');
        $rangeCount = $rangeSales->count();

        // 1. Sales Trend Chart (Grouped by Date with continuous daily timeline)
        $trendData = Sale::where('estado', 'completada')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as total_sales'),
                DB::raw('COUNT(id) as total_orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date');

        $chartDates = [];
        $chartTotals = [];
        $chartOrders = [];

        $currentDate = (clone $startDate)->startOfDay();
        $targetEndDate = (clone $endDate)->startOfDay();

        while ($currentDate->lte($targetEndDate)) {
            $dateStr = $currentDate->format('Y-m-d');
            $row = $trendData->get($dateStr);

            $chartDates[] = $currentDate->format('d M');
            $chartTotals[] = $row ? round((float) $row->total_sales, 2) : 0.0;
            $chartOrders[] = $row ? (int) $row->total_orders : 0;

            $currentDate->addDay();
        }

        // 2. Payment Methods Breakdown Chart (Range)
        $paymentsBreakdown = SalePayment::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->where('estado', 'completada')->whereBetween('created_at', [$startDate, $endDate]);
        })
        ->select('metodo_pago', DB::raw('SUM(monto) as total'))
        ->groupBy('metodo_pago')
        ->get();

        $paymentLabels = [];
        $paymentSeries = [];
        foreach ($paymentsBreakdown as $pb) {
            $label = match ($pb->metodo_pago) {
                'efectivo' => "Efectivo ({$currencyCode})",
                'dolar' => '💵 Dólares (USD)',
                'transferencia' => 'Transferencia',
                'tarjeta' => 'Tarjeta',
                'credito' => 'Venta a Crédito',
                default => ucfirst($pb->metodo_pago),
            };
            $paymentLabels[] = $label;
            $paymentSeries[] = round((float) $pb->total, 2);
        }

        // 3. Top 5 Best Selling Items
        $topItems = SaleItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
            $q->where('estado', 'completada')->whereBetween('created_at', [$startDate, $endDate]);
        })
        ->select('nombre', DB::raw('SUM(cantidad) as total_qty'), DB::raw('SUM(subtotal) as total_amount'))
        ->groupBy('nombre')
        ->orderBy('total_qty', 'desc')
        ->limit(5)
        ->get();

        $topItemNames = $topItems->pluck('nombre')->toArray();
        $topItemQuantities = $topItems->pluck('total_qty')->map(fn($v) => (int) $v)->toArray();

        // Recent Sales Table (Latest 5)
        $recentSales = Sale::with(['user', 'items'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return inertia('admin/dashboard', [
            'currencySymbol' => $currencySymbol,
            'currencyCode' => $currencyCode,
            'valorDolar' => $valorDolar,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'todayStats' => [
                'total_mxn' => $todayTotalMXN,
                'total_usd' => $todayTotalUSD,
                'count' => $todayCount,
                'avg_ticket' => $todayAverageTicket,
            ],
            'rangeStats' => [
                'total' => $rangeTotal,
                'count' => $rangeCount,
            ],
            'registerSummary' => $registerSummary,
            'charts' => [
                'trend' => [
                    'categories' => $chartDates,
                    'totals' => $chartTotals,
                    'orders' => $chartOrders,
                ],
                'payments' => [
                    'labels' => $paymentLabels,
                    'series' => $paymentSeries,
                ],
                'topItems' => [
                    'categories' => $topItemNames,
                    'series' => $topItemQuantities,
                ],
            ],
            'recentSales' => $recentSales,
        ]);
    }
}
