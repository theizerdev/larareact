<?php

namespace App\Policies;

use App\Models\Empresa;
use App\Models\User;

class EmpresaPolicy
{
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
        if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
            return true;
        }

        return $user->empresa_id === $empresa->id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('Super Administrador') || $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Empresa $empresa): bool
    {
        if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
            return true;
        }

        return $user->empresa_id === $empresa->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Empresa $empresa): bool
    {
        return $user->hasRole('Super Administrador') || $user->hasRole('super-admin');
    }
}
