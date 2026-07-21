<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\Departamento;
use App\Models\Cargo;
use App\Models\User;
use Illuminate\Database\Seeder;

class CargoDriscollsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buscar la empresa Driscoll's y su sucursal
        $empresa = Empresa::where('razon_social', "Driscoll's C.A.")->first();
        if (!$empresa) {
            return;
        }

        $sucursal = Sucursal::where('empresa_id', $empresa->id)->first();
        if (!$sucursal) {
            return;
        }

        // 2. Buscar el usuario del sistema
        $user = User::where('email', 'superadmin@example.com')->first() ?: User::first();

        // 3. Obtener departamentos
        $departamentos = Departamento::where('empresa_id', $empresa->id)->get();

        $cargos = [
            'Recursos Humanos' => [
                [
                    'nombre' => 'Gerente de Recursos Humanos',
                    'descripcion' => 'Responsable de la dirección del departamento de gestión humana y compensación.',
                ],
                [
                    'nombre' => 'Analista de Nómina y Reclutamiento',
                    'descripcion' => 'Encargado del cálculo de nóminas y procesos de reclutamiento de personal.',
                ],
            ],
            'Contabilidad y Finanzas' => [
                [
                    'nombre' => 'Contralor de Finanzas',
                    'descripcion' => 'Supervisión de balances generales, auditorías y cumplimiento fiscal.',
                ],
                [
                    'nombre' => 'Analista de Tesorería',
                    'descripcion' => 'Gestión del flujo de caja, pagos de facturas a proveedores y conciliación.',
                ],
            ],
            'Operaciones y Logística' => [
                [
                    'nombre' => 'Gerente de Operaciones Logísticas',
                    'descripcion' => 'Dirección estratégica del almacén general y distribución de frutas a nivel nacional.',
                ],
                [
                    'nombre' => 'Supervisor de Despacho',
                    'descripcion' => 'Control de entrada y salida de camiones, guías de despacho e inventarios.',
                ],
            ],
            'Tecnología y Sistemas' => [
                [
                    'nombre' => 'Administrador de Servidores e Infraestructura',
                    'descripcion' => 'Gestión de redes, seguridad de datos corporativa y mantenimiento de servidores.',
                ],
                [
                    'nombre' => 'Desarrollador Web Full Stack',
                    'descripcion' => 'Desarrollo y optimización de herramientas informáticas internas del negocio.',
                ],
            ],
            'Ventas y Mercadeo' => [
                [
                    'nombre' => 'Coordinador de Mercadeo Regional',
                    'descripcion' => 'Planificación de estrategias publicitarias y relaciones con grandes supermercados.',
                ],
                [
                    'nombre' => 'Ejecutivo de Ventas Corporativas',
                    'descripcion' => 'Atención a cuentas clave de distribución comercial y clientes mayoristas.',
                ],
            ],
        ];

        // 4. Sembrar cargos en la base de datos
        foreach ($departamentos as $dep) {
            if (isset($cargos[$dep->nombre])) {
                foreach ($cargos[$dep->nombre] as $cargoData) {
                    Cargo::updateOrCreate([
                        'nombre' => $cargoData['nombre'],
                        'departamento_id' => $dep->id,
                        'empresa_id' => $empresa->id,
                        'sucursal_id' => $sucursal->id,
                    ], [
                        'descripcion' => $cargoData['descripcion'],
                        'user_id' => $user ? $user->id : 1,
                        'status' => 1,
                    ]);
                }
            }
        }
    }
}
