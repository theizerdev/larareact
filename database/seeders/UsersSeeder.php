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
        $roles = Role::all();
        $empresa = Empresa::withoutGlobalScopes()->first();
        $sucursal = Sucursal::withoutGlobalScopes()->first();

        foreach ($roles as $role) {
            $name = ucwords(str_replace('-', ' ', $role->name));
            $username = strtolower(str_replace('-', '', $role->name));

            $user = User::withoutGlobalScopes()->firstOrCreate([
                'email' => "{$username}@example.com",
            ], [
                'name' => "Usuario {$name}",
                'username' => $username,
                'password' => Hash::make('password'),
                'status' => 'activo',
                'empresa_id' => $empresa?->id,
                'sucursal_id' => $sucursal?->id,
                'pais_telefono_id' => $empresa?->pais_telefono_id,
                'email_verified_at' => now(),
                'password_changed_at' => now(),
            ]);

            $updates = [];
            if (is_null($user->empresa_id) && $empresa) {
                $updates['empresa_id'] = $empresa->id;
            }
            if (is_null($user->sucursal_id) && $sucursal) {
                $updates['sucursal_id'] = $sucursal->id;
            }
            if (is_null($user->pais_telefono_id) && $empresa?->pais_telefono_id) {
                $updates['pais_telefono_id'] = $empresa->pais_telefono_id;
            }

            if (! empty($updates)) {
                $user->update($updates);
            }

            $user->syncRoles([$role->name]);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
