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

                    // Sólo si la sucursal del usuario es de la misma empresa del
                    // registro: si no, quedaría colgado de la sucursal de otra empresa.
                    if ($table !== 'empresas' && $table !== 'sucursales' && isset($user->sucursal_id) && $user->sucursal_id
                        && (int) $user->sucursal?->empresa_id === (int) $model->empresa_id) {
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
        // El Super Administrador no tiene filtro (ve todos los tenants) salvo que
        // haya elegido una empresa en el selector del panel.
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

                // Sin empresa elegida en el selector, el Super Administrador
                // ve todos los tenants. Con una elegida, filtra como un
                // usuario de esa empresa (ver User::entrarAEmpresa).
                if ($isSuperAdmin && ! ($user->empresaActiva ?? null)) {
                    return;
                }

                $table = $builder->getModel()->getTable();

                // Un usuario normal sin empresa no ve datos de ninguna.
                if (! $isSuperAdmin && ! $user->empresa_id) {
                    $builder->whereRaw('1 = 0');

                    return;
                }

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

                // 2. Filtrado por Sucursal (no aplica a la tabla empresas ni al
                // superadmin dentro de una empresa: ve todas sus sucursales)
                // Los catálogos de toda la empresa (TENANT_SOLO_EMPRESA) tampoco:
                // todas sus sucursales comparten los mismos.
                $soloEmpresa = defined(get_class($builder->getModel()).'::TENANT_SOLO_EMPRESA');

                if ($table === 'empresas' || $isSuperAdmin || $soloEmpresa) {
                    // empresas no tiene sucursal_id; el superadmin no se limita a una sucursal
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


