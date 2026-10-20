<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = Role::where('name', 'Vendedor')->get();
        foreach ($roles as $role) {
            $role->givePermissionTo([
                'ventas.terminal',
                'ventas.view',
                'comisiones.view',
                'productos.view',
                'reparaciones.view',
                'reparaciones.create',
                'clientes.view',
                'dashboard.view',
            ]);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
};
