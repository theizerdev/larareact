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

       

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
