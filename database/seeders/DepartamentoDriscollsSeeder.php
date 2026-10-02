<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\User;
use App\Models\Departamento;
use Illuminate\Database\Seeder;

class DepartamentoDriscollsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = Empresa::first();
        if (!$empresa) {
            $empresa = Empresa::create([
                'razon_social' => "Driscoll's",
                'nombre_comercial' => "Driscoll's",
                'status' => true,
            ]);
        }
        $empresaId = $empresa->id;

        $sucursal = Sucursal::where('empresa_id', $empresaId)->first() ?: Sucursal::first();
        if (!$sucursal) {
            $sucursal = Sucursal::create([
                'nombre' => 'Sucursal Principal',
                'empresa_id' => $empresaId,
                'status' => true,
            ]);
        }
        $sucursalId = $sucursal->id;

        $user = User::where('email', 'superadmin@example.com')->first() ?: User::first();
        $userId = $user ? $user->id : 1;

        // Lista única de departamentos
        $departmentNames = [
            'Empaque',
            'Recepcion fruta',
            'Embarques',
            'Logistica',
            'Estimados',
            'Supply',
            'Produccion',
            'Distribucion',
            'Planeacion de cosecha',
            'Inocuidad',
            'MTTO',
            'Seguridad',
            'Calidad',
            'RH',
            'Vigilancia',
            'Auxiliar de Limpieza',
            'Sup Cooler',
        ];

        foreach ($departmentNames as $name) {
            Departamento::updateOrCreate([
                'nombre' => $name,
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
            ], [
                'nombre' => $name,
                'descripcion' => "Departamento de {$name}",
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'user_id' => $userId,
                'status' => 1,
            ]);
        }
    }
}
