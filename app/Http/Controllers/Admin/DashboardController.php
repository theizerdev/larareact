<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\OrdenReparacion;
use App\Models\User;
use App\Services\CashRegisterService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request, CashRegisterService $cashService)
    {
        $user = auth()->user();

        // Si el usuario es Super Administrador o pertenece a la empresa principal (SaaS Owner ID 1),
        // ser redirigido directamente al dashboard exclusivo de suscripciones
        if ($user && ($user->empresa_id === 1 || $user->hasRole('Super Administrador') || $user->hasRole('super-admin'))) {
            return redirect('/superadministrador/dashboard0');
        }

        // Si el usuario tiene rol de Técnico (y no es Admin), renderizar el Dashboard exclusivo de Taller
        $isTecnico = $user && ($user->hasRole('Técnico') || $user->hasRole('tecnico') || $user->hasRole('Tecnico'));
        $isAdmin = $user && ($user->hasRole('Administrador') || $user->hasRole('Super Administrador') || $user->hasRole('super-admin') || $user->hasRole('Admin'));

        if ($isTecnico && !$isAdmin) {
            return $this->dashboardTecnico($user);
        }

        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::today()->subDays(6)->startOfDay();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::now()->endOfDay();

        $empresa = $user?->empresa;
        if (!$empresa && $user?->empresa_id) {
            $empresa = \App\Models\Empresa::find($user->empresa_id);
        }

        $pais = $empresa?->pais ?? ($empresa?->pais_id ? \App\Models\Pais::find($empresa->pais_id) : null);
        $currencySymbol = $pais?->simbolo_moneda ?? '$';
        $currencyCode = $pais?->moneda_principal ?? 'MXN';

        $valorDolar = (float) ($empresa?->valor_dolar ?? 20.0);

        // Active Cash Register of User
        $activeRegister = CashRegister::getActiveRegister();

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

        $maxQty = $topItems->max('total_qty') ?: 1;

        $topItemsFormatted = $topItems->map(function ($item, $index) use ($maxQty) {
            $qty = (int) $item->total_qty;
            $amount = (float) $item->total_amount;
            return [
                'rank' => $index + 1,
                'nombre' => $item->nombre,
                'total_qty' => $qty,
                'total_amount' => round($amount, 2),
                'percent_of_max' => min(100, round(($qty / $maxQty) * 100)),
            ];
        })->values()->toArray();

        $topItemNames = $topItems->pluck('nombre')->toArray();
        $topItemQuantities = $topItems->pluck('total_qty')->map(fn($v) => (int) $v)->toArray();
        $topItemAmounts = $topItems->pluck('total_amount')->map(fn($v) => round((float) $v, 2))->toArray();

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
                    'amounts' => $topItemAmounts,
                    'list' => $topItemsFormatted,
                ],
            ],
            'recentSales' => $recentSales,
        ]);
    }

    public function dashboardTecnico(User $user)
    {
        $empresaId = $user->empresa_id;

        // Conteos KPI exclusivos del técnico logueado
        $counts = [
            'en_diagnostico' => OrdenReparacion::where('empresa_id', $empresaId)->where('tecnico_id', $user->id)->where('estado_orden', 'en_diagnostico')->count(),
            'en_reparacion' => OrdenReparacion::where('empresa_id', $empresaId)->where('tecnico_id', $user->id)->where('estado_orden', 'en_reparacion')->count(),
            'esperando_repuesto' => OrdenReparacion::where('empresa_id', $empresaId)->where('tecnico_id', $user->id)->where('estado_orden', 'esperando_repuesto')->count(),
            'reparado_mes' => OrdenReparacion::where('empresa_id', $empresaId)->where('tecnico_id', $user->id)->where('estado_orden', 'reparado')->where('updated_at', '>=', Carbon::now()->startOfMonth())->count(),
            'total_asignados' => OrdenReparacion::where('empresa_id', $empresaId)->where('tecnico_id', $user->id)->whereNotIn('estado_orden', ['entregado', 'cancelado'])->count(),
        ];

        // Mis Equipos Pendientes de Trabajo
        $misEquiposPendientes = OrdenReparacion::where('empresa_id', $empresaId)
            ->where('tecnico_id', $user->id)
            ->whereNotIn('estado_orden', ['entregado', 'cancelado'])
            ->orderBy('created_at', 'asc')
            ->limit(10)
            ->get();

        // Equipos de la empresa sin asignar (para que el técnico pueda tomar la orden)
        $sinAsignar = OrdenReparacion::where('empresa_id', $empresaId)
            ->whereNull('tecnico_id')
            ->whereNotIn('estado_orden', ['entregado', 'cancelado'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('admin/DashboardTecnico', [
            'tecnico' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'counts' => $counts,
            'misEquiposPendientes' => $misEquiposPendientes,
            'sinAsignar' => $sinAsignar,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';
        $empresa = $user->empresa ?? ($user->empresa_id ? \App\Models\Empresa::find($user->empresa_id) : null);
        if ($empresa && $empresa->pais_id) {
            $pais = \App\Models\Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }
        return '$';
    }
}
