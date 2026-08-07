<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $empresa1 = Empresa::find(1) ?? Empresa::first();
        $sucursal1 = Sucursal::find(1) ?? Sucursal::first();

        $empresa2 = Empresa::find(2);
        $sucursal2 = Sucursal::find(2);

        // 1. Usuarios por defecto para Empresa 1 (Fix Sale Venezuela)
        if ($empresa1) {
            setPermissionsTeamId($empresa1->id);
            $rolesEmpresa1 = Role::where('empresa_id', $empresa1->id)->get();

            foreach ($rolesEmpresa1 as $role) {
                $name = ucwords(str_replace(['-', '_'], ' ', $role->name));
                $username = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $role->name));

                $user = User::firstOrCreate([
                    'email' => "{$username}@example.com",
                ], [
                    'name' => "Usuario {$name}",
                    'username' => $username,
                    'password' => Hash::make('password'),
                    'status' => 'activo',
                    'empresa_id' => $empresa1->id,
                    'sucursal_id' => $sucursal1?->id ?? 1,
                    'email_verified_at' => now(),
                    'whatsapp_verified_at' => now(),
                ]);

                $user->assignRole($role);
            }
        }

        // 2. Usuarios por defecto para Empresa 2 (Fix Sale Chile - Plan de Prueba 7 Días)
        if ($empresa2) {
            setPermissionsTeamId($empresa2->id);

            // A. Administrador Empresa 2
            $adminRole = Role::where('name', 'Administrador')->where('empresa_id', $empresa2->id)->first();
            $adminChile = User::firstOrCreate([
                'email' => 'admin.chile@example.com',
            ], [
                'name' => 'Administrador Sucursal Chile',
                'username' => 'adminchile',
                'password' => Hash::make('password'),
                'status' => 'activo',
                'empresa_id' => $empresa2->id,
                'sucursal_id' => $sucursal2?->id ?? 2,
                'email_verified_at' => now(),
                'whatsapp_verified_at' => now(),
            ]);
            if ($adminRole) {
                $adminChile->assignRole($adminRole);
            }

            // B. Técnico Empresa 2
            $tecnicoRole = Role::where('name', 'Técnico')->where('empresa_id', $empresa2->id)->first()
                ?? Role::where('name', 'Técnico de Reparaciones')->where('empresa_id', $empresa2->id)->first();
            if ($tecnicoRole) {
                $tecnicoChile = User::firstOrCreate([
                    'email' => 'tecnico.chile@example.com',
                ], [
                    'name' => 'Técnico Taller Chile',
                    'username' => 'tecnicochile',
                    'password' => Hash::make('password'),
                    'status' => 'activo',
                    'empresa_id' => $empresa2->id,
                    'sucursal_id' => $sucursal2?->id ?? 2,
                    'email_verified_at' => now(),
                    'whatsapp_verified_at' => now(),
                ]);
                $tecnicoChile->assignRole($tecnicoRole);
            }

            // C. Vendedor / Caja Empresa 2
            $vendedorRole = Role::where('name', 'Vendedor')->where('empresa_id', $empresa2->id)->first();
            if ($vendedorRole) {
                $vendedorChile = User::firstOrCreate([
                    'email' => 'vendedor.chile@example.com',
                ], [
                    'name' => 'Vendedor Caja Chile',
                    'username' => 'vendedorchile',
                    'password' => Hash::make('password'),
                    'status' => 'activo',
                    'empresa_id' => $empresa2->id,
                    'sucursal_id' => $sucursal2?->id ?? 2,
                    'email_verified_at' => now(),
                    'whatsapp_verified_at' => now(),
                ]);
                $vendedorChile->assignRole($vendedorRole);
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
