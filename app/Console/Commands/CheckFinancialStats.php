<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CheckFinancialStats extends Command
{
    protected $signature = 'financial:check';
    protected $description = 'Verificar estadísticas financieras del dashboard';

    public function handle()
    {
        $now = Carbon::now();
        $startDate = $now->copy()->subDays(30);

        $this->info("Período actual: " . $startDate->format('Y-m-d') . " hasta " . $now->format('Y-m-d'));

        $totalIncome = DB::table('pagos')
            ->where('estado', 'completado')
            ->where('fecha_pago', '>=', $startDate)
            ->sum('monto');

        $this->info("Ingresos últimos 30 días: $" . $totalIncome);

        $previousStart = $startDate->copy()->subDays(30);
        $this->info("Período anterior: " . $previousStart->format('Y-m-d') . " hasta " . $startDate->format('Y-m-d'));

        $previousIncome = DB::table('pagos')
            ->where('estado', 'completado')
            ->where('fecha_pago', '>=', $previousStart)
            ->where('fecha_pago', '<', $startDate)
            ->sum('monto');

        $this->info("Ingresos período anterior: $" . $previousIncome);

        if ($previousIncome > 0) {
            $change = (($totalIncome - $previousIncome) / $previousIncome) * 100;
            $this->info("Cambio: " . round($change, 2) . "%");

            if ($change > 0) {
                $this->info("📈 Aumento");
            } elseif ($change < 0) {
                $this->info("📉 Disminución");
            } else {
                $this->info("➡️ Sin cambio");
            }
        } else {
            $this->info("Cambio: No hay datos del período anterior");
        }

        // Verificar también ingresos pendientes
        $pendingIncomePagos = DB::table('pagos')
            ->where('estado', 'pendiente')
            ->where('fecha_pago', '>=', $now)
            ->sum('monto');

        $pendingIncomeSchedule = DB::table('payment_schedules')
            ->where('estado', 'pendiente')
            ->where('fecha_vencimiento', '>=', $now)
            ->sum('monto');

        $totalPending = $pendingIncomePagos + $pendingIncomeSchedule;

        $this->info("");
        $this->info("Ingresos pendientes:");
        $this->info("- Pagos: $" . $pendingIncomePagos);
        $this->info("- Cronograma: $" . $pendingIncomeSchedule);
        $this->info("- Total pendiente: $" . $totalPending);
    }
}
