<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\SubscriptionPayment;
use App\Services\BcvRateService;
use App\Services\EmpresaActivityService;
use App\Services\StripeBalanceService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    /**
     * Dashboard exclusivo para el Super Administrador centrado únicamente
     * en suscripciones actuales, próximas a vencer y alertas sin métricas de caja.
     */
    public function index(Request $request, BcvRateService $bcvService, EmpresaActivityService $activityService, StripeBalanceService $stripeBalanceService)
    {
        $user = auth()->user();

        // Verificar que el usuario tenga rol de Super Administrador o sea de la empresa principal (ID 1)
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador') && ! $user->hasRole('super-admin')) {
            abort(403, 'No tiene permisos para acceder al Dashboard de Super Administrador.');
        }

        $bcvRate = $bcvService->getRate() ?? 36.50;

        // Rango de fechas por defecto: Últimos 7 días
        $startDate = $request->input('start_date') 
            ? Carbon::parse($request->input('start_date'))->startOfDay() 
            : Carbon::now()->subDays(6)->startOfDay();

        $endDate = $request->input('end_date') 
            ? Carbon::parse($request->input('end_date'))->endOfDay() 
            : Carbon::now()->endOfDay();

        // 1. Estadísticas Globales de Suscripciones
        $empresas = Empresa::withCount('sucursales')
            ->orderBy('id', 'asc')
            ->get();

        $totalEmpresas = $empresas->count();
        $activas = $empresas->where('is_exempt', false)->where('subscription_status', 'active')->count();
        $trial = $empresas->where('is_exempt', false)->where('subscription_status', 'trial')->count();
        $vencidas = $empresas->where('is_exempt', false)->where('subscription_status', 'expired')->count();
        $exentas = $empresas->where('is_exempt', true)->count();

        // 2. Empresas Próximas a Vencer (en los próximos 7 días) o en Trial Próximo a Finalizar
        $proximasAVencer = $empresas->filter(function ($emp) {
            if ($emp->isExemptFromSubscription()) {
                return false;
            }

            $dias = $emp->dias_restantes_suscripcion;

            return $dias >= 0 && $dias <= 7;
        })->map(function ($emp) {
            $sub = $emp->getLatestSubscriptionRecord();
            return [
                'id' => $emp->id,
                'razon_social' => $emp->razon_social,
                'documento' => $emp->documento,
                'email' => $emp->email,
                'telefono' => $emp->telefono,
                'subscription_status' => $sub?->estado ?? $emp->subscription_status,
                'dias_restantes' => $emp->dias_restantes_suscripcion,
                'fecha_vencimiento' => $sub?->fecha_vencimiento?->format('d/m/Y')
                    ?? $emp->subscription_expires_at?->format('d/m/Y')
                    ?? $emp->trial_ends_at?->format('d/m/Y')
                    ?? 'N/A',
                'max_sucursales' => $sub?->max_sucursales ?? $emp->max_sucursales ?? 1,
                'total_sucursales' => $emp->sucursales_count,
            ];
        })->values();

        // 3. Solicitudes de Renovación Pendientes de Aprobación
        $pagosPendientes = SubscriptionPayment::with(['empresa', 'user'])
            ->where('estado', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pago) {
                return [
                    'id' => $pago->id,
                    'empresa_id' => $pago->empresa_id,
                    'empresa_nombre' => $pago->empresa?->razon_social ?? 'Empresa N/A',
                    'usuario_nombre' => $pago->user?->name ?? 'Usuario N/A',
                    'monto' => (float) $pago->monto,
                    'ciclo_meses' => $pago->ciclo_meses,
                    'sucursales_contratadas' => $pago->sucursales_contratadas,
                    'metodo_pago' => $pago->metodo_pago,
                    'referencia_pago' => $pago->referencia_pago,
                    'comprobante_path' => $pago->comprobante_path,
                    'created_at' => $pago->created_at->format('d/m/Y H:i'),
                ];
            });

        // 4. Datos para Gráfico de Ingresos por Renovación y Nuevos Registros según Rango de Fechas
        $approvedPaymentsInRange = SubscriptionPayment::where('estado', 'approved')
            ->whereBetween('aprobado_at', [$startDate, $endDate])
            ->get();

        $totalRevenueInRange = (float) $approvedPaymentsInRange->sum('monto');

        // Generar serie diaria/mensual para ApexCharts
        $revenueChartCategories = [];
        $revenueChartData = [];
        
        $currentDate = clone $startDate;
        while ($currentDate <= $endDate) {
            $dateStr = $currentDate->format('Y-m-d');
            $displayLabel = $currentDate->format('d M');
            
            $daySum = (float) $approvedPaymentsInRange->filter(function ($pago) use ($dateStr) {
                return $pago->aprobado_at && Carbon::parse($pago->aprobado_at)->format('Y-m-d') === $dateStr;
            })->sum('monto');

            $revenueChartCategories[] = $displayLabel;
            $revenueChartData[] = round($daySum, 2);

            $currentDate->addDay();
        }

        // 5. Listado Resumido de Estado Actual de Todas las Empresas con Telemetría de Uso
        $allEmpresaIds = $empresas->pluck('id')->toArray();
        $activityMetrics = $activityService->getActivityMetricsForEmpresas($allEmpresaIds);

        $empresasResumen = $empresas->map(function ($emp) use ($activityMetrics) {
            $sub = $emp->getLatestSubscriptionRecord();
            return [
                'id' => $emp->id,
                'razon_social' => $emp->razon_social,
                'documento' => $emp->documento,
                'email' => $emp->email,
                'telefono' => $emp->telefono,
                'subscription_status' => $sub?->estado ?? $emp->subscription_status,
                'estado_legible' => $emp->estado_suscripcion_legible,
                'dias_restantes' => $emp->dias_restantes_suscripcion,
                'is_exempt' => $emp->isExemptFromSubscription(),
                'fecha_vencimiento' => $emp->isExemptFromSubscription()
                    ? 'Permanente'
                    : ($sub?->fecha_vencimiento?->format('d/m/Y') ?? $emp->subscription_expires_at?->format('d/m/Y') ?? $emp->trial_ends_at?->format('d/m/Y') ?? 'N/A'),
                'total_sucursales' => $emp->sucursales_count,
                'created_at' => $emp->created_at ? $emp->created_at->format('d/m/Y') : 'N/A',
                'activity' => $activityMetrics[$emp->id] ?? null,
            ];
        });

        // 6. Historial Reciente de Renovaciones Aprobadas
        $renovacionesRecientes = SubscriptionPayment::with(['empresa', 'user'])
            ->where('estado', 'approved')
            ->orderBy('aprobado_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($pago) {
                return [
                    'id' => $pago->id,
                    'empresa_nombre' => $pago->empresa?->razon_social ?? 'N/A',
                    'monto' => (float) $pago->monto,
                    'ciclo_meses' => $pago->ciclo_meses,
                    'aprobado_at' => $pago->aprobado_at ? Carbon::parse($pago->aprobado_at)->format('d/m/Y') : $pago->updated_at->format('d/m/Y'),
                ];
            });

        // 7. Balance en vivo de Stripe y cálculo en USD
        $stripeBalance = $stripeBalanceService->getBalance();

        // 8. Comparativa mensual y series para Sparklines en Cards (Últimos 6 meses)
        $sparklineMonths = [];
        $activeTrend = [];
        $registrationsTrend = [];
        $renewalsTrend = [];
        $renewalsCountTrend = [];

        for ($i = 5; $i >= 0; $i--) {
            $monthDate = Carbon::now()->subMonths($i);
            $monthKey = $monthDate->format('Y-m');
            $sparklineMonths[] = rtrim(ucfirst($monthDate->translatedFormat('M')), '.');

            // Ingresos de renovaciones en ese mes
            $monthPayments = SubscriptionPayment::where('estado', 'approved')
                ->whereRaw("DATE_FORMAT(aprobado_at, '%Y-%m') = ?", [$monthKey]);
            $monthRev = (float) $monthPayments->sum('monto');
            $renewalsTrend[] = round($monthRev, 2);
            $renewalsCountTrend[] = $monthPayments->count();

            // Nuevas empresas registradas en ese mes
            $monthReg = $empresas->filter(function ($e) use ($monthKey) {
                return $e->created_at && $e->created_at->format('Y-m') === $monthKey;
            })->count();
            $registrationsTrend[] = $monthReg;

            // Histórico de empresas activas
            $endOfMonth = $monthDate->copy()->endOfMonth();
            $monthAct = $empresas->filter(function ($e) use ($endOfMonth) {
                return ! $e->isExemptFromSubscription() 
                    && $e->subscription_status === 'active' 
                    && $e->created_at 
                    && $e->created_at <= $endOfMonth;
            })->count();
            if ($i === 0) {
                $monthAct = max($monthAct, $activas);
            }
            $activeTrend[] = max(1, $monthAct);
        }

        $prevAct = $activeTrend[4] ?? 1;
        $currAct = $activeTrend[5] ?? 1;
        $activeDiffPct = $prevAct > 0 ? round((($currAct - $prevAct) / $prevAct) * 100, 1) : 0;

        $prevReg = $registrationsTrend[4] ?? 0;
        $currReg = $registrationsTrend[5] ?? 0;
        $regDiff = $currReg - $prevReg;

        $prevRev = $renewalsTrend[4] ?? 0;
        $currRev = $renewalsTrend[5] ?? 0;
        $revDiffPct = $prevRev > 0 ? round((($currRev - $prevRev) / $prevRev) * 100, 1) : ($currRev > 0 ? 100 : 0);

        $prevRevCount = $renewalsCountTrend[4] ?? 0;
        $currRevCount = $renewalsCountTrend[5] ?? 0;

        $monthlySparklines = [
            'months' => $sparklineMonths,
            'active' => [
                'data' => $activeTrend,
                'diff_pct' => $activeDiffPct,
                'diff_count' => $currAct - $prevAct,
                'prev_value' => $prevAct,
                'curr_value' => $currAct,
            ],
            'registrations' => [
                'data' => $registrationsTrend,
                'diff' => $regDiff,
                'prev_value' => $prevReg,
                'curr_value' => $currReg,
            ],
            'renewals' => [
                'data' => $renewalsTrend,
                'count_data' => $renewalsCountTrend,
                'diff_pct' => $revDiffPct,
                'prev_value' => $prevRev,
                'curr_value' => $currRev,
                'prev_count' => $prevRevCount,
                'curr_count' => $currRevCount,
            ],
        ];

        return inertia('superadmin/dashboard0', [
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'stats' => [
                'total_empresas' => $totalEmpresas,
                'activas' => $activas,
                'trial' => $trial,
                'vencidas' => $vencidas,
                'exentas' => $exentas,
                'pagos_pendientes' => $pagosPendientes->count(),
                'proximas_vencer' => $proximasAVencer->count(),
                'total_revenue_in_range' => round($totalRevenueInRange, 2),
                'en_linea' => collect($activityMetrics)->where('is_online', true)->count(),
                'activas_semana' => collect($activityMetrics)->whereIn('activity_status', ['online', 'active_today', 'recent'])->count(),
                'inactivas' => collect($activityMetrics)->whereIn('activity_status', ['inactive', 'never'])->count(),
            ],
            'stripeBalance' => $stripeBalance,
            'monthlySparklines' => $monthlySparklines,
            'revenueChart' => [
                'categories' => $revenueChartCategories,
                'data' => $revenueChartData,
            ],
            'statusDistribution' => [
                'activas' => $activas,
                'trial' => $trial,
                'vencidas' => $vencidas,
                'exentas' => $exentas,
            ],
            'proximasAVencer' => $proximasAVencer,
            'pagosPendientes' => $pagosPendientes,
            'empresasResumen' => $empresasResumen,
            'renovacionesRecientes' => $renovacionesRecientes,
            'bcvRate' => $bcvRate,
        ]);
    }

    /**
     * Endpoint API para refrescar el balance de Stripe sin recargar la página completa.
     */
    public function refreshStripeBalance(StripeBalanceService $stripeBalanceService)
    {
        $user = auth()->user();
        if ($user->empresa_id !== 1 && ! $user->hasRole('Super Administrador') && ! $user->hasRole('super-admin')) {
            abort(403, 'No autorizado.');
        }

        return response()->json($stripeBalanceService->getBalance(true));
    }
}
