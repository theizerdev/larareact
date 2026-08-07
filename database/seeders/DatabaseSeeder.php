<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PaisSeeder::class,
            PermissionSeeder::class,
            RoleSeeder::class,
            SubscriptionPlansSeeder::class,
            EmpresaSeeder::class,
            SucursalSeeder::class,
            UsersSeeder::class,
            TestimonioSeeder::class,
            EquiposInicialSeeder::class,
            ServiciosReparacionSeeder::class,
        ]);
    }
}
