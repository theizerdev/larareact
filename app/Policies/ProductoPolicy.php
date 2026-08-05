<?php

namespace App\Policies;

use App\Models\Producto;
use App\Models\User;

class ProductoPolicy
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
    public function view(User $user, Producto $producto): bool
    {
        if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
            return true;
        }

        return $user->empresa_id === $producto->empresa_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Producto $producto): bool
    {
        if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
            return true;
        }

        return $user->empresa_id === $producto->empresa_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Producto $producto): bool
    {
        if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
            return true;
        }

        return $user->empresa_id === $producto->empresa_id;
    }
}
