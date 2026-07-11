<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Multitenantable
{
    public static function bootMultitenantable(): void
    {
        // Auto-fill empresa_id y sucursal_id al crear registros
        static::creating(function ($model) {
            if (auth()->check()) {
                $user = auth()->user();
                if (! $model->empresa_id && $user->empresa_id) {
                    $model->empresa_id = $user->empresa_id;
                }
                if (! $model->sucursal_id && $user->sucursal_id) {
                    $model->sucursal_id = $user->sucursal_id;
                }
            }
        });

        // Global scope: filtra por empresa y sucursal del usuario autenticado
        // El Super Administrador no tiene filtro (ve todos los tenants)
        static::addGlobalScope('multitenancy', function (Builder $builder) {
            if (! auth()->check()) {
                return;
            }

            $user = auth()->user();

            if ($user->hasRole('Super Administrador')) {
                return;
            }

            $table = $builder->getModel()->getTable();

            if ($user->empresa_id) {
                $builder->where("{$table}.empresa_id", $user->empresa_id);
            }

            // Solo filtrar por sucursal si el usuario tiene una asignada
            // Si sucursal_id es null, el usuario ve toda su empresa
            if ($user->sucursal_id) {
                $builder->where("{$table}.sucursal_id", $user->sucursal_id);
            }
        });
    }

    /**
     * Desactivar el scope de multitenancy para consultas cross-tenant.
     * Uso: Contacto::withoutTenant()->get();
     */
    public static function withoutTenant(): Builder
    {
        return static::withoutGlobalScope('multitenancy');
    }
}
