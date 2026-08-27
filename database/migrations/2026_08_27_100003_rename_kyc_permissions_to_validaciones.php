<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Renombra los permisos `kyc.*` (creados el 2026-08-27, aún sin uso real)
     * a `validaciones.*`, que es como se expone ahora: un módulo propio del
     * sistema "Validaciones", sin referencia a JAAK.
     *
     * Se hace por UPDATE del mismo registro para conservar las asignaciones en
     * `role_has_permissions` (mismo permission_id). El PermissionSeeder ya crea
     * `validaciones.*` con updateOrCreate; esta migración solo cubre el caso de
     * bases donde `kyc.*` ya existía.
     */
    public function up(): void
    {
        $map = [
            'kyc.view' => ['name' => 'validaciones.view', 'slug' => 'Ver validaciones de identidad'],
            'kyc.manage' => ['name' => 'validaciones.manage', 'slug' => 'Gestionar / revalidar validaciones'],
        ];

        foreach ($map as $old => $new) {
            // Si ya existe el destino (seeder lo creó), elimina el viejo huérfano.
            if (DB::table('permissions')->where('name', $new['name'])->exists()) {
                $oldId = DB::table('permissions')->where('name', $old)->value('id');
                if ($oldId) {
                    DB::table('role_has_permissions')->where('permission_id', $oldId)->delete();
                    DB::table('permissions')->where('id', $oldId)->delete();
                }

                continue;
            }

            DB::table('permissions')->where('name', $old)->update([
                'name' => $new['name'],
                'slug' => $new['slug'],
                'module' => 'validaciones',
                'updated_at' => now(),
            ]);
        }

        if (class_exists(\Spatie\Permission\PermissionRegistrar::class)) {
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        }
    }

    public function down(): void
    {
        $map = [
            'validaciones.view' => 'kyc.view',
            'validaciones.manage' => 'kyc.manage',
        ];

        foreach ($map as $new => $old) {
            DB::table('permissions')->where('name', $new)->update([
                'name' => $old,
                'module' => 'integraciones',
                'updated_at' => now(),
            ]);
        }
    }
};
