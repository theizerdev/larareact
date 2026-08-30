<?php

namespace Database\Seeders;

use App\Models\ConfiguracionContable;
use App\Models\CuentaContable;
use App\Models\Empresa;
use App\Models\ReparacionChecklistItem;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TenantSeeder extends Seeder
{
    /**
     * Seed initial data for a newly created tenant database.
     */
    public function run(int|string|null $tenantId = null, ?array $empresaData = []): void
    {
        $tenantId = $tenantId ? (int) $tenantId : null;

        // 1. Crear Sucursal Principal si no existe
        $sucursal = Sucursal::firstOrCreate(
            ['nombre' => 'Sucursal Principal'],
            [
                'empresa_id' => $tenantId,
                'pais_telefono_id' => $empresaData['pais_telefono_id'] ?? null,
                'telefono' => $empresaData['telefono'] ?? null,
                'direccion' => $empresaData['direccion'] ?? 'Dirección Principal',
                'status' => true,
            ]
        );

        // 2. Sembrar Permisos en el Tenant
        $this->call(PermissionSeeder::class);

        // 3. Crear Roles estándar para el Tenant
        $adminRole = Role::firstOrCreate([
            'name' => 'Administrador',
            'guard_name' => 'web',
            'empresa_id' => $tenantId,
        ]);
        $allPermissions = Permission::where('name', '!=', 'subscriptions.manage')->get();
        $adminRole->syncPermissions($allPermissions);

        $tecnicoRole = Role::firstOrCreate([
            'name' => 'Técnico',
            'guard_name' => 'web',
            'empresa_id' => $tenantId,
        ]);
        $tecnicoPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'reparaciones.view', 'reparaciones.create', 'reparaciones.edit',
            'inventario.view', 'clientes.view'
        ])->get();
        $tecnicoRole->syncPermissions($tecnicoPermissions);

        $vendedorRole = Role::firstOrCreate([
            'name' => 'Vendedor',
            'guard_name' => 'web',
            'empresa_id' => $tenantId,
        ]);
        $vendedorPermissions = Permission::whereIn('name', [
            'dashboard.view',
            'pos.view', 'pos.create',
            'clientes.view', 'clientes.create',
            'inventario.view',
        ])->get();
        $vendedorRole->syncPermissions($vendedorPermissions);

        // 4. Sembrar Plan de Cuentas Contables Básico
        $caja = CuentaContable::firstOrCreate(['codigo' => '1.1.01'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Caja General',
            'tipo' => 'activo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $banco = CuentaContable::firstOrCreate(['codigo' => '1.1.02'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Bancos',
            'tipo' => 'activo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $cxc = CuentaContable::firstOrCreate(['codigo' => '1.1.03'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Cuentas por Cobrar Clientes',
            'tipo' => 'activo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $invProd = CuentaContable::firstOrCreate(['codigo' => '1.1.05'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Inventario de Productos',
            'tipo' => 'activo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $invRep = CuentaContable::firstOrCreate(['codigo' => '1.1.06'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Inventario de Repuestos',
            'tipo' => 'activo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $cxp = CuentaContable::firstOrCreate(['codigo' => '2.1.01'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Cuentas por Pagar Proveedores',
            'tipo' => 'pasivo',
            'naturaleza' => 'acreedora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $vtaProd = CuentaContable::firstOrCreate(['codigo' => '4.1.01'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Venta de Productos / Mercancías',
            'tipo' => 'ingreso',
            'naturaleza' => 'acreedora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $vtaSrv = CuentaContable::firstOrCreate(['codigo' => '4.1.02'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Ingresos por Servicios y Reparaciones',
            'tipo' => 'ingreso',
            'naturaleza' => 'acreedora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $cstProd = CuentaContable::firstOrCreate(['codigo' => '5.1.01'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Costo de Venta de Productos',
            'tipo' => 'costo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $cstRep = CuentaContable::firstOrCreate(['codigo' => '5.1.02'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Costo de Repuestos Utilizados',
            'tipo' => 'costo',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        $gastos = CuentaContable::firstOrCreate(['codigo' => '6.1.01'], [
            'empresa_id' => $tenantId,
            'nombre' => 'Gastos Generales y de Administración',
            'tipo' => 'gasto',
            'naturaleza' => 'deudora',
            'nivel' => 2,
            'activa' => true,
        ]);

        ConfiguracionContable::firstOrCreate(
            ['empresa_id' => $tenantId],
            [
                'rubro_comercial' => 'hibrido',
                'cuenta_caja_id' => $caja->id,
                'cuenta_banco_id' => $banco->id,
                'cuenta_cuentas_por_cobrar_id' => $cxc->id,
                'cuenta_cuentas_por_pagar_id' => $cxp->id,
                'cuenta_inventario_productos_id' => $invProd->id,
                'cuenta_inventario_repuestos_id' => $invRep->id,
                'cuenta_ventas_productos_id' => $vtaProd->id,
                'cuenta_ventas_servicios_id' => $vtaSrv->id,
                'cuenta_costo_ventas_productos_id' => $cstProd->id,
                'cuenta_costo_repuestos_id' => $cstRep->id,
                'cuenta_gastos_generales_id' => $gastos->id,
                'contabilidad_automatica' => true,
            ]
        );

        // 5. Sembrar Checklist de Reparaciones por defecto
        $checklists = [
            'Pantalla / Táctil',
            'Batería y Ciclos de Carga',
            'Tapa Trasera y Chasis',
            'Cámara Principal (Trasera)',
            'Cámara Frontal (Selfie)',
            'Conector de Carga / Puerto USB',
            'Botones de Volumen / Encendido',
            'Altavoz / Auricular',
            'Micrófono',
            'Señal Móvil / Wi-Fi / Bluetooth',
            'Face ID / Huella Dactilar',
        ];

        foreach ($checklists as $index => $item) {
            ReparacionChecklistItem::firstOrCreate([
                'nombre' => $item,
                'empresa_id' => $tenantId,
            ], [
                'categoria' => 'general',
                'activo' => true,
                'orden' => $index + 1,
            ]);
        }
    }
}
