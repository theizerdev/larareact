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

        return CashMovement::create([
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
    }

    public function closeRegister(CashRegister $register, ?float $countedAmount = null): CashRegister
    {
        $inflows = (float) $register->movements()->where('type', 'inflow')->sum('amount');
        $outflows = (float) $register->movements()->where('type', 'outflow')->sum('amount');
        $openingAmount = (float) $register->opening_amount;
        $expectedAmount = $openingAmount + $inflows - $outflows;

        $data = [
            'closing_amount' => $expectedAmount,
            'expected_amount' => $expectedAmount,
            'closed_at' => Carbon::now(),
            'status' => 'closed',
        ];

        if ($countedAmount !== null) {
            $data['counted_amount'] = $countedAmount;
            $data['difference'] = $countedAmount - $expectedAmount;
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
