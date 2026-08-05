<?php

namespace App\Policies;

use App\Models\Empresa;
use App\Models\User;

class EmpresaPolicy
{
    /**
     * Perform pre-authorization checks for Super Admin (system owner).
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->id === 1
            || $user->hasRole('Super Administrador')
            || $user->hasRole('super-admin')
            || $user->hasRole('Super Admin')
        ) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Empresa $empresa): bool
    {
        return $user->empresa_id === $empresa->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Empresa $empresa): bool
    {
        return $user->empresa_id === $empresa->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Empresa $empresa): bool
    {
        return false;
    }
}
