<?php

namespace App\Traits;

use App\Models\Empresa;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToEmpresa
{
    /**
     * Boot the BelongsToEmpresa trait.
     */
    public static function bootBelongsToEmpresa(): void
    {
        // Asigna automáticamente el empresa_id al crear un registro si no está definido
        static::creating(function ($model) {
            if (auth()->check() && empty($model->empresa_id)) {
                $user = auth()->user();
                if ($user && $user->empresa_id) {
                    $model->empresa_id = $user->empresa_id;
                }
            }
        });

        // Global scope: Filtra automáticamente por la empresa del usuario autenticado
        static::addGlobalScope('empresa_scope', function (Builder $builder) {
            if (! auth()->check()) {
                return;
            }

            $user = auth()->user();

            if (! $user) {
                return;
            }

            // El Super Administrador ve todos los datos de todas las empresas
            if ($user->hasRole('Super Administrador') || $user->hasRole('super-admin')) {
                return;
            }

            if ($user->empresa_id) {
                $table = $builder->getModel()->getTable();
                $builder->where("{$table}.empresa_id", $user->empresa_id);
            }
        });
    }

    /**
     * Relación con Empresa.
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    /**
     * Desactivar el scope de empresa para consultas globales/administrativas.
     */
    public static function withoutEmpresa(): Builder
    {
        return static::withoutGlobalScope('empresa_scope');
    }
}
