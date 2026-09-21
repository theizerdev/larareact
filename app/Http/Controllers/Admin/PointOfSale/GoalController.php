<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sale;
use App\Models\SalesGoal;
use App\Models\Sucursal;
use Carbon\Carbon;
use Illuminate\Http\Request;

class GoalController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';

        $empresa = $user->empresa;
        if (!$empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function index(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user->empresa_id;
        $empresa = $user?->empresa ?? ($empresaId ? Empresa::find($empresaId) : null);
        $timezone = $empresa?->getTimezone() ?? $user?->getTimezone() ?? 'America/Mexico_City';
        $nowInTz = Carbon::now($timezone);
        $offset = $nowInTz->format('P'); // Ej: -06:00 o -04:00

        // Parametros de filtrado basados en la zona horaria local de la empresa
        $currentYear = (int) $nowInTz->format('Y');
        $currentMonth = (int) $nowInTz->format('n');

        $year = (int) $request->input('year', $currentYear);
        $month = (int) $request->input('month', $currentMonth);
        $sucursalId = $request->input('sucursal_id', $user->sucursal_id);

        // Cargar sucursales para el filtro
        $sucursales = Sucursal::when($empresaId, function ($q) use ($empresaId) {
            return $q->where('empresa_id', $empresaId);
        })->get(['id', 'nombre']);

        // Obtener meta guardada o inicial
        $goal = SalesGoal::where('year', $year)
            ->where('month', $month)
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->first();

        // Rango UTC exacto del mes en la zona horaria local de la empresa
        $startOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->startOfMonth()->setTimezone('UTC');
        $endOfMonthUtc = Carbon::createFromDate($year, $month, 1, $timezone)->endOfMonth()->setTimezone('UTC');

        // Consulta de ventas del mes/año seleccionado en la zona horaria local
        $salesQuery = Sale::whereBetween('created_at', [$startOfMonthUtc, $endOfMonthUtc])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->whereNotIn('estado', ['anulada', 'cancelada']);

        $actualSalesTotal = (float) $salesQuery->sum('total');

        // Calcular datos del mes
        $daysInMonth = Carbon::createFromDate($year, $month, 1, $timezone)->daysInMonth;

        // Calcular ventas por día convirtiendo created_at a la zona horaria local de la empresa
        $salesByDayRaw = (clone $salesQuery)
            ->selectRaw("DAY(CONVERT_TZ(created_at, '+00:00', '{$offset}')) as day_num, SUM(total) as daily_total")
            ->groupBy('day_num')
            ->pluck('daily_total', 'day_num')
            ->toArray();

        $salesByDay = [];
        for ($d = 1; $d <= $daysInMonth; $d++) {
            $salesByDay[$d] = (float) ($salesByDayRaw[$d] ?? 0);
        }

        // Meta asignada e incremento
        $incrementPercentage = $goal ? (float) $goal->increment_percentage : 0;
        $targetAmount = $goal ? (float) $goal->target_amount : 0;

        if ($targetAmount == 0 && $incrementPercentage > 0 && $actualSalesTotal > 0) {
            $targetAmount = round($actualSalesTotal * (1 + $incrementPercentage / 100), 2);
        }

        // Objetivo promedio diario del mes completo
        $dailyAverageTarget = $daysInMonth > 0 ? round($targetAmount / $daysInMonth, 2) : 0;

        // Generar rangos dinámicos de semanas (Lunes a Domingo)
        // Semana 1: del día 1 hasta el primer domingo del mes.
        // Semanas intermedias: de lunes a domingo.
        // Última semana: del último lunes hasta el fin de mes.
        $weekRanges = [];
        $currentStart = 1;
        $semanaIndex = 1;

        while ($currentStart <= $daysInMonth) {
            $dateObj = Carbon::createFromDate($year, $month, $currentStart, $timezone);
            if ($dateObj->dayOfWeek === Carbon::SUNDAY) {
                $endDay = $currentStart;
            } else {
                $sundayDate = $dateObj->copy()->endOfWeek(Carbon::SUNDAY);
                $endDay = ($sundayDate->month == $month) ? min($sundayDate->day, $daysInMonth) : $daysInMonth;
            }

            $weekRanges[] = [
                'semana' => $semanaIndex,
                'inicio' => $currentStart,
                'fin' => $endDay,
            ];

            $currentStart = $endDay + 1;
            $semanaIndex++;
        }

        $weeksBreakdown = [];
        $totalAllocatedMeta = 0.0;
        $totalWeeks = count($weekRanges);

        foreach ($weekRanges as $idx => $range) {
            $semNum = $range['semana'];
            $startDay = $range['inicio'];
            $endDay = $range['fin'];
            $countDays = $endDay - $startDay + 1;
            $isLastWeek = ($idx === $totalWeeks - 1);

            $dailySalesMap = [
                'lunes' => 0.0,
                'martes' => 0.0,
                'miercoles' => 0.0,
                'jueves' => 0.0,
                'viernes' => 0.0,
                'sabado' => 0.0,
                'domingo' => 0.0,
            ];

            $totalSemana = 0.0;

            for ($d = $startDay; $d <= $endDay; $d++) {
                $dateObj = Carbon::createFromDate($year, $month, $d, $timezone);
                $dayOfWeek = strtolower($dateObj->locale('es')->dayName); // lunes, martes...
                
                // Normalizar tildes si las hay (miércoles -> miercoles, sábado -> sabado)
                $dayOfWeekKey = str_replace(['ércoles', 'ábado'], ['ercoles', 'abado'], $dayOfWeek);

                $montoDia = $salesByDay[$d] ?? 0.0;
                $totalSemana += $montoDia;

                if (isset($dailySalesMap[$dayOfWeekKey])) {
                    $dailySalesMap[$dayOfWeekKey] += $montoDia;
                }
            }

            // Distribuir meta proporcional a los días de la semana y cuadrar centavos en la última semana
            if ($isLastWeek && $targetAmount > 0) {
                $metaSemanal = round($targetAmount - $totalAllocatedMeta, 2);
            } else {
                $metaSemanal = round(($targetAmount / $daysInMonth) * $countDays, 2);
                $totalAllocatedMeta += $metaSemanal;
            }

            $porcentajeAvance = $metaSemanal > 0 ? round(($totalSemana / $metaSemanal) * 100, 1) : 0;
            $objetivoDiario = $countDays > 0 ? round($metaSemanal / $countDays, 2) : 0;

            $weeksBreakdown[] = [
                'semana' => "Semana {$semNum}",
                'inicio_dia' => $startDay,
                'fin_dia' => $endDay,
                'dias' => $countDays,
                'dias_map' => $dailySalesMap,
                'total_ventas' => $totalSemana,
                'meta_semanal' => $metaSemanal,
                'porcentaje_avance' => $porcentajeAvance,
                'objetivo_diario' => $objetivoDiario,
            ];
        }

        // Años disponibles (año actual - 2 hasta año actual + 1)
        $yearsList = range($currentYear - 2, $currentYear + 1);

        $monthsList = [
            1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
            5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
            9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre'
        ];

        return inertia('admin/PointOfSale/Metas/Index', [
            'goal' => $goal,
            'filters' => [
                'year' => $year,
                'month' => $month,
                'sucursal_id' => $sucursalId ? (int) $sucursalId : null,
            ],
            'actualSalesTotal' => $actualSalesTotal,
            'targetAmount' => $targetAmount,
            'incrementPercentage' => $incrementPercentage,
            'dailyAverageTarget' => $dailyAverageTarget,
            'overallProgress' => $targetAmount > 0 ? round(($actualSalesTotal / $targetAmount) * 100, 1) : 0,
            'weeksBreakdown' => $weeksBreakdown,
            'yearsList' => $yearsList,
            'monthsList' => $monthsList,
            'sucursales' => $sucursales,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'year' => 'required|integer',
            'month' => 'required|integer|between:1,12',
            'sucursal_id' => 'nullable|integer',
            'increment_percentage' => 'nullable|numeric|min:0',
            'target_amount' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $empresaId = $user->empresa_id;
        $sucursalId = $validated['sucursal_id'] ?? $user->sucursal_id;
        $empresa = $user?->empresa ?? ($empresaId ? Empresa::find($empresaId) : null);
        $timezone = $empresa?->getTimezone() ?? $user?->getTimezone() ?? 'America/Mexico_City';

        $startOfMonthUtc = Carbon::createFromDate($validated['year'], $validated['month'], 1, $timezone)->startOfMonth()->setTimezone('UTC');
        $endOfMonthUtc = Carbon::createFromDate($validated['year'], $validated['month'], 1, $timezone)->endOfMonth()->setTimezone('UTC');

        // Calcular ventas base para guardar snapshot en la zona horaria local
        $baseSales = (float) Sale::whereBetween('created_at', [$startOfMonthUtc, $endOfMonthUtc])
            ->when($empresaId, fn($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn($q) => $q->where('sucursal_id', $sucursalId))
            ->whereNotIn('estado', ['anulada', 'cancelada'])
            ->sum('total');

        SalesGoal::updateOrCreate(
            [
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'year' => $validated['year'],
                'month' => $validated['month'],
            ],
            [
                'base_sales' => $baseSales,
                'increment_percentage' => $validated['increment_percentage'] ?? 0,
                'target_amount' => $validated['target_amount'],
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return back()->with('success', __('Meta de ventas guardada correctamente.'));
    }
}
