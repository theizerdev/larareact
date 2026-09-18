<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\CashMovement;
use App\Models\User;
use Illuminate\Support\Carbon;

class CashRegisterService
{
    public function openRegister(int $userId, float $openingAmount): CashRegister
    {
        $user = User::find($userId);

        return CashRegister::create([
            'user_id' => $userId,
            'empresa_id' => $user?->empresa_id,
            'sucursal_id' => $user?->sucursal_id,
            'opening_amount' => $openingAmount,
            'opened_at' => Carbon::now(),
            'status' => 'open',
        ]);
    }

    public function addMovement(
        CashRegister $register,
        string $type,
        string $concepto,
        string $metodoPago,
        float $amount,
        ?string $description,
        int $creatorId
    ): CashMovement {
        $creator = User::find($creatorId);

        $movement = CashMovement::create([
            'cash_register_id' => $register->id,
            'empresa_id' => $creator?->empresa_id ?? $register->empresa_id,
            'sucursal_id' => $creator?->sucursal_id ?? $register->sucursal_id,
            'type' => $type,
            'concepto' => $concepto,
            'metodo_pago' => $metodoPago,
            'amount' => $amount,
            'description' => $description,
            'created_by' => $creatorId,
        ]);

        try {
            app(\App\Services\AccountingService::class)->recordCashMovementEntry($movement);
        } catch (\Throwable $e) {
            // Silencioso
        }

        return $movement;
    }

    /**
     * Get complete financial summary of a register, factoring in annulled sales,
     * net inflows, real outflows and cash expected amount.
     */
    public function getRegisterFinancialSummary(CashRegister $register): array
    {
        $openingAmount = (float) $register->opening_amount;

        // Auto-reconcile any annulled sales in this register that might not have a movement yet
        $anuladasSinMovimiento = \App\Models\Sale::where('cash_register_id', $register->id)
            ->where('estado', 'anulada')
            ->get();

        foreach ($anuladasSinMovimiento as $saleAnulada) {
            $hasMov = $register->movements()
                ->where('concepto', 'anulacion_venta')
                ->where('amount', $saleAnulada->total)
                ->exists();
            if (!$hasMov) {
                $this->addMovement(
                    $register,
                    'outflow',
                    'anulacion_venta',
                    $saleAnulada->metodo_pago ?? 'efectivo',
                    (float) $saleAnulada->total,
                    "Anulación Venta {$saleAnulada->codigo_ticket} - Ajuste de conciliación",
                    $register->user_id
                );
            }
        }

        $grossInflows = (float) $register->movements()->where('type', 'inflow')->sum('amount');

        $anulacionesTotal = (float) $register->movements()
            ->where('concepto', 'anulacion_venta')
            ->sum('amount');

        $salesAnuladasDirect = (float) \App\Models\Sale::where('cash_register_id', $register->id)
            ->where('estado', 'anulada')
            ->sum('total');
        $anulacionesTotal = max($anulacionesTotal, $salesAnuladasDirect);

        $netInflows = max(0, $grossInflows - $anulacionesTotal);

        // Real operational expenses/withdrawals (excluding sale cancellations)
        $realOutflows = (float) $register->movements()
            ->where('type', 'outflow')
            ->where('concepto', '!=', 'anulacion_venta')
            ->sum('amount');

        $totalOutflowsAll = (float) $register->movements()->where('type', 'outflow')->sum('amount');

        // Physical Cash movements (efectivo y dolar)
        $cashInflows = (float) $register->movements()
            ->where('type', 'inflow')
            ->whereIn('metodo_pago', ['efectivo', 'dolar'])
            ->sum('amount');

        $cashAnulaciones = (float) $register->movements()
            ->where('concepto', 'anulacion_venta')
            ->whereIn('metodo_pago', ['efectivo', 'dolar'])
            ->sum('amount');

        $cashExpenses = (float) $register->movements()
            ->where('type', 'outflow')
            ->where('concepto', '!=', 'anulacion_venta')
            ->whereIn('metodo_pago', ['efectivo', 'dolar'])
            ->sum('amount');

        $cashOutflows = $cashAnulaciones + $cashExpenses;
        $expectedCashAmount = $openingAmount + $cashInflows - $cashOutflows;

        // Electronic inflows net of cancellations
        $electronicInflowsGross = (float) $register->movements()
            ->where('type', 'inflow')
            ->whereNotIn('metodo_pago', ['efectivo', 'dolar'])
            ->sum('amount');

        $electronicAnulaciones = (float) $register->movements()
            ->where('concepto', 'anulacion_venta')
            ->whereNotIn('metodo_pago', ['efectivo', 'dolar'])
            ->sum('amount');

        $electronicInflowsNet = max(0, $electronicInflowsGross - $electronicAnulaciones);

        $paymentBreakdown = $this->getPaymentMethodBreakdown($register);

        $totalShiftBalance = $openingAmount + $netInflows - $realOutflows;

        return [
            'id' => $register->id,
            'opened_at' => $register->opened_at,
            'opening_amount' => $openingAmount,
            'gross_inflows' => $grossInflows,
            'total_anuladas' => $anulacionesTotal,
            'inflows' => $netInflows,
            'outflows' => $realOutflows,
            'total_outflows_all' => $totalOutflowsAll,
            'cash_inflows' => $cashInflows,
            'cash_anulaciones' => $cashAnulaciones,
            'cash_expenses' => $cashExpenses,
            'cash_outflows' => $cashOutflows,
            'electronic_inflows' => $electronicInflowsNet,
            'expected_cash_balance' => $expectedCashAmount,
            'expected_balance' => $expectedCashAmount,
            'total_turn_sales' => $netInflows,
            'total_turn_balance' => $totalShiftBalance,
            'current_balance' => $totalShiftBalance,
            'by_payment_method' => $paymentBreakdown,
        ];
    }

    public function closeRegister(CashRegister $register, ?float $countedAmount = null): CashRegister
    {
        $financialSummary = $this->getRegisterFinancialSummary($register);
        $expectedCashAmount = (float) $financialSummary['expected_cash_balance'];

        $data = [
            'closing_amount' => $countedAmount !== null ? $countedAmount : $expectedCashAmount,
            'expected_amount' => $expectedCashAmount,
            'closed_at' => Carbon::now(),
            'status' => 'closed',
        ];

        if ($countedAmount !== null) {
            $data['counted_amount'] = $countedAmount;
            $data['difference'] = $countedAmount - $expectedCashAmount;
        }

        $register->update($data);

        return $register;
    }

    /**
     * Get breakdown of movements by payment method for a register.
     */
    public function getPaymentMethodBreakdown(CashRegister $register): array
    {
        $rows = $register->movements()
            ->selectRaw('metodo_pago, type, SUM(amount) as total')
            ->groupBy('metodo_pago', 'type')
            ->get();

        $breakdown = [];
        foreach ($rows as $row) {
            $method = $row->metodo_pago;
            if (!isset($breakdown[$method])) {
                $breakdown[$method] = ['inflow' => 0.0, 'outflow' => 0.0, 'net' => 0.0];
            }
            $breakdown[$method][$row->type] = (float) $row->total;
        }
        foreach ($breakdown as $method => $vals) {
            $breakdown[$method]['net'] = $vals['inflow'] - $vals['outflow'];
        }

        return $breakdown;
    }
}
