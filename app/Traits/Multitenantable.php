<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Multitenantable
{
    public static function bootMultitenantable(): void
    {
        // Auto-fill empresa_id y sucursal_id al crear registros
        static::creating(function ($model) {
            static $isResolvingCreating = false;

            if ($isResolvingCreating) {
                return;
            }

            $isResolvingCreating = true;

            try {
                if (auth()->check()) {
                    $user = auth()->user();
                    if (! $user) {
                        return;
                    }

                    $table = $model->getTable();

                    if ($table !== 'empresas' && isset($user->empresa_id) && $user->empresa_id) {
                        if (! isset($model->empresa_id) || empty($model->empresa_id)) {
                            $model->empresa_id = $user->empresa_id;
                        }
                    }

                    if ($table !== 'sucursales' && isset($user->sucursal_id) && $user->sucursal_id) {
                        if (! isset($model->sucursal_id) || empty($model->sucursal_id)) {
                            $model->sucursal_id = $user->sucursal_id;
                        }
                    }
                }
            } finally {
                $isResolvingCreating = false;
            }
        });

        // Global scope: filtra por empresa y sucursal del usuario autenticado
        // El Super Administrador no tiene filtro (ve todos los tenants)
        static::addGlobalScope('multitenancy', function (Builder $builder) {
            static $isResolvingUser = false;

            if ($isResolvingUser) {
                return;
            }

            $isResolvingUser = true;

            try {
                if (! auth()->check()) {
                    return;
                }

                $user = auth()->user();

                if (! $user) {
                    return;
                }

                // Verificar si el usuario es Super Administrador
                $isSuperAdmin = method_exists($user, 'isSuperAdmin')
                    ? $user->isSuperAdmin()
                    : (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['Super Administrador', 'super-admin', 'Super Admin', 'super_admin']));

                if ($isSuperAdmin) {
                    return;
                }

                $table = $builder->getModel()->getTable();

                // 1. Filtrado por Empresa
                if ($table === 'empresas') {
                    if ($user->empresa_id) {
                        $builder->where("{$table}.id", $user->empresa_id);
                    }
                } else {
                    if ($user->empresa_id) {
                        $builder->where("{$table}.empresa_id", $user->empresa_id);
                    }
                }

                // 2. Filtrado por Sucursal (no aplica a la tabla empresas)
                if ($table === 'empresas') {
                    // La tabla empresas representa el tenant principal y no posee columna sucursal_id
                } elseif ($table === 'sucursales') {
                    if ($user->sucursal_id) {
                        $builder->where("{$table}.id", $user->sucursal_id);
                    }
                } else {
                    if ($user->sucursal_id) {
                        $builder->where("{$table}.sucursal_id", $user->sucursal_id);
                    }
                }
            } finally {
                $isResolvingUser = false;
            }
        });
    }

    /**
     * Desactivar el scope de multitenancy para consultas cross-tenant.
     * Uso: Modelo::withoutTenant()->get();
     */
    public static function withoutTenant(): Builder
    {
        return static::withoutGlobalScope('multitenancy');
    }
}


