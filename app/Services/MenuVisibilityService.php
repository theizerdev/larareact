<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Visibilidad del menú lateral en dos niveles. Ambos guardan solo lo OCULTO.
 *
 *  - Empresa: lo que contrató el cliente. Techo para todos sus usuarios.
 *  - Rol: segmentación dentro de ese techo. Con varios roles, un módulo se
 *    oculta solo si TODOS los roles del usuario lo ocultan (gana el más permisivo).
 *  - Super Administrador: ve todo, nunca se le oculta nada (así no puede
 *    quedarse sin el propio panel que configura esto).
 *
 * Ocultar es puramente visual: los permisos y el acceso por URL no cambian.
 */
class MenuVisibilityService
{
    private const TTL = 3600;

    /** @return array<string, bool> clave => false, solo las ocultas (formato que ya espera el frontend) */
    public static function hiddenFor(?User $user): array
    {
        if (! $user || $user->isSuperAdmin()) {
            return [];
        }

        $hidden = $user->empresa_id ? self::empresaKeys((int) $user->empresa_id) : [];

        $roleIds = $user->roles->pluck('id')->all();
        if ($roleIds) {
            $porRol = array_map(fn ($id) => self::roleKeys((int) $id), $roleIds);
            $hidden = array_merge($hidden, count($porRol) > 1 ? array_values(array_intersect(...$porRol)) : $porRol[0]);
        }

        return array_fill_keys(array_unique($hidden), false);
    }

    /** @return string[] */
    public static function empresaKeys(int $empresaId): array
    {
        return Cache::remember("menu_vis.empresa.$empresaId", self::TTL, fn () => DB::table('empresa_menu_visibility')
            ->where('empresa_id', $empresaId)->pluck('menu_key')->all());
    }

    /** @return string[] */
    public static function roleKeys(int $roleId): array
    {
        return Cache::remember("menu_vis.role.$roleId", self::TTL, fn () => DB::table('role_menu_visibility')
            ->where('role_id', $roleId)->pluck('menu_key')->all());
    }

    /** @param string[] $hiddenKeys */
    public static function syncEmpresa(int $empresaId, array $hiddenKeys): void
    {
        self::sync('empresa_menu_visibility', 'empresa_id', $empresaId, $hiddenKeys);
        Cache::forget("menu_vis.empresa.$empresaId");
    }

    /** @param string[] $hiddenKeys */
    public static function syncRole(int $roleId, array $hiddenKeys): void
    {
        self::sync('role_menu_visibility', 'role_id', $roleId, $hiddenKeys);
        Cache::forget("menu_vis.role.$roleId");
    }

    private static function sync(string $table, string $column, int $id, array $hiddenKeys): void
    {
        $now = now();

        DB::transaction(function () use ($table, $column, $id, $hiddenKeys, $now) {
            DB::table($table)->where($column, $id)->delete();

            $rows = array_map(fn ($key) => [
                $column => $id, 'menu_key' => $key, 'created_at' => $now, 'updated_at' => $now,
            ], array_values(array_unique($hiddenKeys)));

            if ($rows) {
                DB::table($table)->insert($rows);
            }
        });
    }
}
