<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\Marca;
use App\Models\ModeloEquipo;
use App\Models\PlanFinanciamiento;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class CreditoModuloSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'inventario' => [
                'marcas.view' => 'Ver Marcas',
                'marcas.create' => 'Crear Marca',
                'marcas.edit' => 'Editar Marca',
                'marcas.delete' => 'Eliminar Marca',

                'modelos.view' => 'Ver Modelos de Equipos',
                'modelos.create' => 'Crear Modelo de Equipo',
                'modelos.edit' => 'Editar Modelo de Equipo',
                'modelos.delete' => 'Eliminar Modelo de Equipo',

                'equipos.view' => 'Ver Inventario de Equipos (IMEI)',
                'equipos.create' => 'Registrar Equipo por IMEI',
                'equipos.edit' => 'Editar Equipo',
                'equipos.delete' => 'Eliminar Equipo',
            ],
            'clientes' => [
                'clientes.view' => 'Ver Clientes',
                'clientes.create' => 'Registrar Cliente',
                'clientes.edit' => 'Editar Cliente',
                'clientes.delete' => 'Eliminar Cliente',
            ],
            'creditos' => [
                'planes.view' => 'Ver Planes de Financiamiento',
                'planes.create' => 'Crear Plan de Financiamiento',
                'planes.edit' => 'Editar Plan de Financiamiento',
                'planes.delete' => 'Eliminar Plan de Financiamiento',

                'creditos.view' => 'Ver Créditos y Ventas Financiadas',
                'creditos.create' => 'Crear Nueva Venta a Crédito',
                'creditos.approve' => 'Aprobar Crédito',
                'creditos.cancel' => 'Anular Crédito',

                'cuotas.view' => 'Ver Cronograma de Cuotas',
                'cuotas.pay' => 'Registrar Cobro de Cuota',
            ],
        ];

        foreach ($permissions as $sector => $items) {
            foreach ($items as $name => $slug) {
                $module = match (true) {
                    str_starts_with($name, 'marcas.') => 'marcas',
                    str_starts_with($name, 'modelos.') => 'modelos',
                    str_starts_with($name, 'equipos.') => 'inventario_equipos',
                    str_starts_with($name, 'clientes.') => 'clientes',
                    str_starts_with($name, 'planes.') => 'planes_financiamiento',
                    str_starts_with($name, 'creditos.') => 'creditos',
                    str_starts_with($name, 'cuotas.') => 'cuotas',
                    default => 'creditos',
                };

                Permission::updateOrCreate(
                    ['name' => $name, 'guard_name' => 'web'],
                    [
                        'slug' => $slug,
                        'module' => $module,
                        'sector' => $sector,
                    ]
                );
            }
        }

        // Asignar a super-admin y admin
        $superAdmin = Role::where('name', 'super-admin')->first();
        if ($superAdmin) {
            $superAdmin->syncPermissions(Permission::all());
        }

        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $admin->syncPermissions(Permission::all());
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Sembrar Marcas Populares
        $marcasData = [
            ['nombre' => 'Samsung', 'slug' => 'samsung'],
            ['nombre' => 'Xiaomi', 'slug' => 'xiaomi'],
            ['nombre' => 'Apple', 'slug' => 'apple'],
            ['nombre' => 'Infinix', 'slug' => 'infinix'],
            ['nombre' => 'Tecno', 'slug' => 'tecno'],
            ['nombre' => 'Motorola', 'slug' => 'motorola'],
            ['nombre' => 'Honor', 'slug' => 'honor'],
        ];

        $marcasMap = [];
        foreach ($marcasData as $m) {
            $marcasMap[$m['slug']] = Marca::firstOrCreate(['slug' => $m['slug']], [
                'nombre' => $m['nombre'],
                'activo' => true,
            ]);
        }

        // Sembrar Modelos representativos
        $modelosData = [
            ['marca' => 'samsung', 'nombre' => 'Galaxy A15', 'almacenamiento' => '128GB', 'ram' => '6GB', 'bateria' => '5000mAh'],
            ['marca' => 'samsung', 'nombre' => 'Galaxy A25 5G', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
            ['marca' => 'samsung', 'nombre' => 'Galaxy A55 5G', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
            ['marca' => 'xiaomi', 'nombre' => 'Redmi Note 13', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
            ['marca' => 'xiaomi', 'nombre' => 'Redmi 13C', 'almacenamiento' => '128GB', 'ram' => '6GB', 'bateria' => '5000mAh'],
            ['marca' => 'infinix', 'nombre' => 'Hot 40 Pro', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
            ['marca' => 'tecno', 'nombre' => 'Spark 20 Pro', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
            ['marca' => 'apple', 'nombre' => 'iPhone 13', 'almacenamiento' => '128GB', 'ram' => '4GB', 'bateria' => '3240mAh'],
            ['marca' => 'motorola', 'nombre' => 'Moto G54 5G', 'almacenamiento' => '256GB', 'ram' => '8GB', 'bateria' => '5000mAh'],
        ];

        foreach ($modelosData as $mod) {
            if (isset($marcasMap[$mod['marca']])) {
                ModeloEquipo::firstOrCreate([
                    'marca_id' => $marcasMap[$mod['marca']]->id,
                    'nombre' => $mod['nombre'],
                    'almacenamiento' => $mod['almacenamiento'],
                ], [
                    'ram' => $mod['ram'],
                    'bateria' => $mod['bateria'],
                    'activo' => true,
                ]);
            }
        }

        // Sembrar Planes de Financiamiento para las empresas existentes
        $empresas = Empresa::all();
        foreach ($empresas as $empresa) {
            PlanFinanciamiento::firstOrCreate([
                'empresa_id' => $empresa->id,
                'nombre' => 'Plan Estándar - 4 Quincenas',
            ], [
                'descripcion' => 'Financiamiento en 4 cuotas quincenales (2 meses) con 30% de inicial.',
                'frecuencia' => 'quincenal',
                'numero_cuotas' => 4,
                'porcentaje_inicial_minimo' => 30.00,
                'porcentaje_interes_total' => 15.00,
                'dias_gracia' => 2,
                'mora_diaria_porcentaje' => 0.50,
                'activo' => true,
            ]);

            PlanFinanciamiento::firstOrCreate([
                'empresa_id' => $empresa->id,
                'nombre' => 'Plan Extendido - 6 Quincenas',
            ], [
                'descripcion' => 'Financiamiento en 6 cuotas quincenales (3 meses) con 40% de inicial.',
                'frecuencia' => 'quincenal',
                'numero_cuotas' => 6,
                'porcentaje_inicial_minimo' => 40.00,
                'porcentaje_interes_total' => 20.00,
                'dias_gracia' => 2,
                'mora_diaria_porcentaje' => 0.50,
                'activo' => true,
            ]);

            PlanFinanciamiento::firstOrCreate([
                'empresa_id' => $empresa->id,
                'nombre' => 'Plan Mensual - 3 Cuotas',
            ], [
                'descripcion' => 'Financiamiento en 3 cuotas mensuales con 30% de inicial.',
                'frecuencia' => 'mensual',
                'numero_cuotas' => 3,
                'porcentaje_inicial_minimo' => 30.00,
                'porcentaje_interes_total' => 18.00,
                'dias_gracia' => 3,
                'mora_diaria_porcentaje' => 0.50,
                'activo' => true,
            ]);
        }
    }
}

