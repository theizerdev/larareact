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
        // 1. Crear o buscar la empresa Driscoll's
        $empresa = Empresa::firstOrCreate([
            'razon_social' => "Driscoll's C.A.",
        ], [
            'documento' => 'J-45678912-3',
            'direccion' => 'Torre Driscoll, Calle de las Frutas, Caracas',
            'telefono' => '+58 212 999 9999',
            'email' => 'info@driscolls.com',
            'pais_id' => 20, // Default Venezuela en PaisSeeder
            'pais_telefono_id' => 20,
            'status' => true,
        ]);

        // 2. Crear o buscar la sucursal de Driscoll's
        $sucursal = Sucursal::firstOrCreate([
            'nombre' => "Sucursal Principal Driscoll's",
            'empresa_id' => $empresa->id,
        ], [
            'direccion' => "Avenida Francisco de Miranda, Edificio Driscoll's, Piso 1",
            'telefono' => '+58 212 999 9991',
            'status' => true,
        ]);

        // 3. Buscar el usuario del sistema asignado (prioridad superadmin)
        $user = User::where('email', 'superadmin@example.com')->first() ?: User::first();

        // 4. Departamentos a sembrar
        $departments = [
            [
                'nombre' => 'Recursos Humanos',
                'codigo' => 'DEP-RRHH-01',
                'responsable' => 'Ana Martínez',
                'piso' => 'Piso 1',
                'ubicacion' => 'Ala Oeste, Oficina 102',
                'descripcion' => 'Gestión de nóminas, contratación de personal y bienestar organizacional.',
                'latitud' => 10.4900,
                'longitud' => -66.8800,
            ],
            [
                'nombre' => 'Contabilidad y Finanzas',
                'codigo' => 'DEP-FIN-01',
                'responsable' => 'Pedro Pérez',
                'piso' => 'Piso 2',
                'ubicacion' => 'Ala Norte, Oficina 205',
                'descripcion' => 'Control de cuentas por pagar, facturación, auditorías y contabilidad general.',
                'latitud' => 10.4910,
                'longitud' => -66.8810,
            ],
            [
                'nombre' => 'Operaciones y Logística',
                'codigo' => 'DEP-OPS-01',
                'responsable' => 'Juan Gómez',
                'piso' => 'Planta Baja',
                'ubicacion' => 'Muelle A de Despacho',
                'descripcion' => 'Planificación de la cadena de suministro, control de stocks y distribución.',
                'latitud' => 10.4920,
                'longitud' => -66.8820,
            ],
            [
                'nombre' => 'Tecnología y Sistemas',
                'codigo' => 'DEP-TI-01',
                'responsable' => 'María Rodríguez',
                'piso' => 'Piso 3',
                'ubicacion' => 'Ala Este, Oficina de Sistemas',
                'descripcion' => 'Mantenimiento de servidores, red local, seguridad informática y soporte.',
                'latitud' => 10.4930,
                'longitud' => -66.8830,
            ],
            [
                'nombre' => 'Ventas y Mercadeo',
                'codigo' => 'DEP-VNT-01',
                'responsable' => 'Luis García',
                'piso' => 'Piso 1',
                'ubicacion' => 'Ala Este, Oficina 105',
                'descripcion' => 'Atención al cliente, expansión de mercado nacional y estrategias de marca.',
                'latitud' => 10.4940,
                'longitud' => -66.8840,
            ],
        ];

        // 5. Sembrar departamentos en la base de datos
        foreach ($departments as $dep) {
            Departamento::updateOrCreate([
                'nombre' => $dep['nombre'],
                'empresa_id' => $empresa->id,
                'sucursal_id' => $sucursal->id,
            ], array_merge($dep, [
                'user_id' => $user ? $user->id : 1,
                'status' => 1,
            ]));
        }
    }
}
