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

            // Evitar loop si el modelo que se está consultando es el propio User autenticado o se está autenticando
            $user = auth()->user();

            if (! $user) {
                return;
            }

            if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
                return;
            }

            $table = $builder->getModel()->getTable();

            // Si se consulta la propia tabla users, evitar que un usuario no pueda loguearse o auto-consultarse
            if ($table === 'users') {
                return;
            }

            if ($user->empresa_id) {
                $builder->where("{$table}.empresa_id", $user->empresa_id);
            }

            // Solo filtrar por sucursal si el usuario tiene una asignada
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
