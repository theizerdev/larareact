<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\SubscriptionPayment;
use App\Services\BcvRateService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SuperAdminDashboardController extends Controller
{
    /**
     * Dashboard exclusivo para el Super Administrador centrado únicamente
     * en suscripciones actuales, próximas a vencer y alertas sin métricas de caja.
     */
    public function index(Request $request, BcvRateService $bcvService)
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

        // 5. Listado Resumido de Estado Actual de Todas las Empresas
        $empresasResumen = $empresas->map(function ($emp) {
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
            ],
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
}
