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

    public function closeRegister(CashRegister $register): CashRegister
    {
        $inflows = (float) $register->movements()->where('type', 'inflow')->sum('amount');
        $outflows = (float) $register->movements()->where('type', 'outflow')->sum('amount');
        $openingAmount = (float) $register->opening_amount;
        $closingAmount = $openingAmount + $inflows - $outflows;

        $register->update([
            'closing_amount' => $closingAmount,
            'closed_at' => Carbon::now(),
            'status' => 'closed',
        ]);

        return $register;
    }
}
