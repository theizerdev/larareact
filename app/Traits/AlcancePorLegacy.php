<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

/**
 * Limita los colaboradores (y sus registros) al Legacy del usuario
 * autenticado, como Multitenantable lo hace con la empresa y la sucursal.
 *
 * Sólo aplica a cuentas con `users.legacy` (Responsable de zona, Gerente
 * RRHH). El propio colaborador de la cuenta siempre queda visible, para que
 * pueda checar y ver su bitácora aunque su Legacy sea otro.
 *
 * `empleados` se filtra por su columna `legacy`; cualquier otro modelo que
 * use el trait, por su `empleado_id`.
 */
trait AlcancePorLegacy
{
    public static function bootAlcancePorLegacy(): void
    {
        static::addGlobalScope('alcance_legacy', function (Builder $builder) {
            static $resolviendo = false;

            if ($resolviendo) {
                return;
            }

            $resolviendo = true;

            try {
                $user = auth()->check() ? auth()->user() : null;
                $legacy = trim((string) ($user->legacy ?? ''));

                if (! $user || $legacy === '' || (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin())) {
                    return;
                }

                $table = $builder->getModel()->getTable();

                if ($table === 'empleados') {
                    $builder->where(function (Builder $q) use ($table, $legacy, $user) {
                        $q->where("{$table}.legacy", $legacy)->orWhere("{$table}.user_id", $user->id);
                    });

                    return;
                }

                $builder->whereIn("{$table}.empleado_id", function ($sub) use ($legacy, $user) {
                    $sub->select('id')->from('empleados')
                        ->where('legacy', $legacy)
                        ->orWhere('user_id', $user->id);
                });
            } finally {
                $resolviendo = false;
            }
        });
    }
}
