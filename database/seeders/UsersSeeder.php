<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Empresa;
use App\Models\Sucursal;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class UsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = Role::all();
        $empresa = Empresa::first();
        $sucursal = Sucursal::first();

        foreach ($roles as $role) {
            $name = ucwords(str_replace('-', ' ', $role->name));
            $username = strtolower(str_replace('-', '', $role->name));

            $user = User::firstOrCreate([
                'email' => "{$username}@example.com"
            ], [
                'name' => "Usuario {$name}",
                'username' => $username,
                'password' => Hash::make('password'),
                'status' => 'activo',
                'empresa_id' => $empresa ? $empresa->id : null,
                'sucursal_id' => $sucursal ? $sucursal->id : null,
                'email_verified_at' => now(),
            ]);


                $user->assignRole($role->name);

        }
    }
}
