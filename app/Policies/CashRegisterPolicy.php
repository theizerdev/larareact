<?php

namespace App\Policies;

use App\Models\CashRegister;
use App\Models\User;

class CashRegisterPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // Accessible to authenticated admin / cashier users
    }

    public function view(User $user, CashRegister $register): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, CashRegister $register): bool
    {
        return $register->status === 'open';
    }

    public function close(User $user, CashRegister $register): bool
    {
        return $register->status === 'open';
    }

    public function deleteMovement(User $user, CashRegister $register): bool
    {
        return $register->status === 'open';
    }
}
