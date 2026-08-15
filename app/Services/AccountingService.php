<?php

namespace App\Services;

use App\Models\ApunteContable;
use App\Models\AsientoContable;
use App\Models\CashMovement;
use App\Models\Cliente;
use App\Models\Compra;
use App\Models\ConfiguracionContable;
use App\Models\CuentaContable;
use App\Models\Empresa;
use App\Models\Proveedor;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class AccountingService
{
    /**
     * Configurar la contabilidad inicial de una empresa según su rubro comercial.
     */
    public function setupCompanyAccountingByRubro(Empresa $empresa, string $rubro = 'hibrido'): ConfiguracionContable
    {
        return DB::transaction(function () use ($empresa, $rubro) {
            $empresaId = $empresa->id;

            // 1. Definición del catálogo de cuentas oficial del SAT México
            $accountsTree = [
                // 1. ACTIVOS (SAT 100)
                ['codigo' => '100', 'codigo_sat' => '100', 'nombre' => 'ACTIVO', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '100.1', 'codigo_sat' => '100', 'nombre' => 'ACTIVO CORRIENTE', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '100'],
                
                ['codigo' => '101', 'codigo_sat' => '101', 'nombre' => 'Caja y Efectivo', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '100.1'],
                ['codigo' => '101.01', 'codigo_sat' => '101.01', 'nombre' => 'Caja General / POS', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '101', 'key' => 'caja'],
                
                ['codigo' => '102', 'codigo_sat' => '102', 'nombre' => 'Bancos Nacionales', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '100.1'],
                ['codigo' => '102.01', 'codigo_sat' => '102.01', 'nombre' => 'Bancos / Transferencias', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '102', 'key' => 'banco'],

                ['codigo' => '105', 'codigo_sat' => '105', 'nombre' => 'Clientes Nacionales', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '100.1'],
                ['codigo' => '105.01', 'codigo_sat' => '105.01', 'nombre' => 'Clientes / Cuentas por Cobrar POS', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '105', 'key' => 'cxc'],

                ['codigo' => '113', 'codigo_sat' => '113', 'nombre' => 'Impuestos Acreditable y Pagos Provisional', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '100.1'],
                ['codigo' => '113.01', 'codigo_sat' => '113.01', 'nombre' => 'IVA Acreditable Pagado (16%)', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '113', 'key' => 'iva_acreditable'],
                ['codigo' => '113.02', 'codigo_sat' => '113.02', 'nombre' => 'IVA Acreditable Pendiente de Pago', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '113'],
                ['codigo' => '113.03', 'codigo_sat' => '113.03', 'nombre' => 'ISR Retenido / Anticipo de Impuestos', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '113'],

                ['codigo' => '115', 'codigo_sat' => '115', 'nombre' => 'Inventarios', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '100.1'],
                ['codigo' => '115.01', 'codigo_sat' => '115.01', 'nombre' => 'Inventario de Productos y Mercadería', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '115', 'key' => 'inv_prod'],
                ['codigo' => '115.02', 'codigo_sat' => '115.02', 'nombre' => 'Inventario de Repuestos e Insumos Taller', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '115', 'key' => 'inv_rep'],

                // 2. PASIVOS (SAT 200)
                ['codigo' => '200', 'codigo_sat' => '200', 'nombre' => 'PASIVO', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '200.1', 'codigo_sat' => '200', 'nombre' => 'PASIVO CORRIENTE', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '200'],
                
                ['codigo' => '201', 'codigo_sat' => '201', 'nombre' => 'Proveedores Nacionales', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 3, 'acepta' => false, 'padre' => '200.1'],
                ['codigo' => '201.01', 'codigo_sat' => '201.01', 'nombre' => 'Proveedores y Cuentas por Pagar', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '201', 'key' => 'cxp'],

                ['codigo' => '208', 'codigo_sat' => '208', 'nombre' => 'Impuestos Trasladados y Retenidos SAT', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 3, 'acepta' => false, 'padre' => '200.1'],
                ['codigo' => '208.01', 'codigo_sat' => '208.01', 'nombre' => 'IVA Trasladado Cobrado (16%)', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '208', 'key' => 'iva_trasladado'],
                ['codigo' => '208.02', 'codigo_sat' => '208.02', 'nombre' => 'IVA Trasladado Pendiente de Cobro', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '208'],
                ['codigo' => '208.03', 'codigo_sat' => '208.03', 'nombre' => 'ISR Retenido por Pagar', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '208'],
                ['codigo' => '208.04', 'codigo_sat' => '208.04', 'nombre' => 'IVA Retenido por Pagar', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '208'],

                // 3. CAPITAL / PATRIMONIO (SAT 300)
                ['codigo' => '300', 'codigo_sat' => '300', 'nombre' => 'PATRIMONIO / CAPITAL CONTABLE', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '301', 'codigo_sat' => '301', 'nombre' => 'Capital Social Contribuido', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '300'],
                ['codigo' => '301.01', 'codigo_sat' => '301.01', 'nombre' => 'Capital Social / Aportaciones de Socios', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '301'],
                ['codigo' => '305', 'codigo_sat' => '305', 'nombre' => 'Resultado del Ejercicio', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '300'],
                ['codigo' => '305.01', 'codigo_sat' => '305.01', 'nombre' => 'Utilidad / Pérdida del Ejercicio Fiscal', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '305'],

                // 4. INGRESOS (SAT 400)
                ['codigo' => '400', 'codigo_sat' => '400', 'nombre' => 'INGRESOS', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '401', 'codigo_sat' => '401', 'nombre' => 'Ventas e Ingresos Operacionales', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '400'],
                ['codigo' => '401.01', 'codigo_sat' => '401.01', 'nombre' => 'Ingresos por Venta de Productos Tasa 16%', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '401', 'key' => 'vta_prod'],
                ['codigo' => '401.02', 'codigo_sat' => '401.02', 'nombre' => 'Ingresos por Servicios Técnicos y Reparaciones', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '401', 'key' => 'vta_srv'],
                ['codigo' => '401.03', 'codigo_sat' => '401.03', 'nombre' => 'Ingresos Tasa 0% / Exentos', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '401'],

                // 5. COSTOS (SAT 500)
                ['codigo' => '500', 'codigo_sat' => '500', 'nombre' => 'COSTOS', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '501', 'codigo_sat' => '501', 'nombre' => 'Costo de Ventas y Reparaciones', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '500'],
                ['codigo' => '501.01', 'codigo_sat' => '501.01', 'nombre' => 'Costo de Ventas (Productos)', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '501', 'key' => 'cst_prod'],
                ['codigo' => '501.02', 'codigo_sat' => '501.02', 'nombre' => 'Costo de Repuestos y Materiales Taller', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '501', 'key' => 'cst_rep'],

                // 6. GASTOS DE OPERACIÓN Y ADMINISTRACIÓN (SAT 600)
                ['codigo' => '600', 'codigo_sat' => '600', 'nombre' => 'GASTOS GENERALES DE OPERACIÓN', 'tipo' => 'gasto', 'naturaleza' => 'deudora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '601', 'codigo_sat' => '601', 'nombre' => 'Gastos Generales y de Administración (SAT)', 'tipo' => 'gasto', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '600'],
                ['codigo' => '601.01', 'codigo_sat' => '601.01', 'nombre' => 'Gastos Generales de Operación y Oficina', 'tipo' => 'gasto', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '601', 'key' => 'gastos'],
            ];

            $createdModels = [];
            foreach ($accountsTree as $item) {
                $padreId = null;
                if (!empty($item['padre'])) {
                    $padreId = $createdModels[$item['padre']]->id ?? null;
                }

                $cuenta = CuentaContable::withoutGlobalScopes()->updateOrCreate(
                    [
                        'empresa_id' => $empresaId,
                        'codigo' => $item['codigo'],
                    ],
                    [
                        'codigo_sat' => $item['codigo_sat'] ?? $item['codigo'],
                        'nombre' => $item['nombre'],
                        'tipo' => $item['tipo'],
                        'naturaleza' => $item['naturaleza'],
                        'nivel' => $item['nivel'],
                        'padre_id' => $padreId,
                        'acepta_movimiento' => $item['acepta'],
                        'activa' => true,
                    ]
                );

                $createdModels[$item['codigo']] = $cuenta;
                if (!empty($item['key'])) {
                    $createdModels["key_{$item['key']}"] = $cuenta;
                }
            }

            // 2. Guardar o actualizar la configuración de cuentas por defecto
            return ConfiguracionContable::withoutGlobalScopes()->updateOrCreate(
                ['empresa_id' => $empresaId],
                [
                    'rubro_comercial' => $rubro,
                    'cuenta_caja_id' => $createdModels['key_caja']->id ?? null,
                    'cuenta_banco_id' => $createdModels['key_banco']->id ?? null,
                    'cuenta_ventas_productos_id' => $createdModels['key_vta_prod']->id ?? null,
                    'cuenta_ventas_servicios_id' => $createdModels['key_vta_srv']->id ?? null,
                    'cuenta_costo_ventas_productos_id' => $createdModels['key_cst_prod']->id ?? null,
                    'cuenta_costo_repuestos_id' => $createdModels['key_cst_rep']->id ?? null,
                    'cuenta_inventario_productos_id' => $createdModels['key_inv_prod']->id ?? null,
                    'cuenta_inventario_repuestos_id' => $createdModels['key_inv_rep']->id ?? null,
                    'cuenta_cuentas_por_cobrar_id' => $createdModels['key_cxc']->id ?? null,
                    'cuenta_cuentas_por_pagar_id' => $createdModels['key_cxp']->id ?? null,
                    'cuenta_gastos_generales_id' => $createdModels['key_gastos']->id ?? null,
                    'contabilidad_automatica' => true,
                ]
            );
        });
    }

    /**
     * Obtener o inicializar la configuración contable de una empresa.
     */
    public function getConfig(int $empresaId): ConfiguracionContable
    {
        $config = ConfiguracionContable::withoutGlobalScopes()->where('empresa_id', $empresaId)->first();
        if (!$config) {
            $empresa = Empresa::find($empresaId);
            if ($empresa) {
                return $this->setupCompanyAccountingByRubro($empresa, 'hibrido');
            }
        }
        return $config;
    }

    /**
     * Contabilizar automáticamente una Venta POS / Crédito (con desglose de productos y servicios técnicos).
     */
    public function recordSaleEntry(Sale $sale): ?AsientoContable
    {
        if (!$sale->empresa_id) return null;

        $config = $this->getConfig($sale->empresa_id);
        if (!$config || !$config->contabilidad_automatica) return null;

        return DB::transaction(function () use ($sale, $config) {
            $tasaDolar = (float) ($sale->empresa?->valor_dolar ?? 20.0);
            if ($tasaDolar <= 0) $tasaDolar = 1.0;

            // Evitar duplicados si ya se generó un asiento para esta venta
            $asientoExistente = AsientoContable::withoutGlobalScopes()
                ->where('origen_type', Sale::class)
                ->where('origen_id', $sale->id)
                ->first();

            if ($asientoExistente) {
                return $asientoExistente;
            }

            $asiento = AsientoContable::create([
                'empresa_id' => $sale->empresa_id,
                'sucursal_id' => $sale->sucursal_id,
                'numero_asiento' => 'AST-VTA-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT),
                'fecha' => $sale->created_at ?? now(),
                'glosa' => "Venta Ticket #{$sale->codigo_ticket} - {$sale->cliente_nombre}",
                'origen_type' => Sale::class,
                'origen_id' => $sale->id,
                'tasa_cambio' => $tasaDolar,
                'estado' => 'contabilizado',
                'created_by' => $sale->user_id,
            ]);

            // 1. DEBE: Caja/Banco o Cuentas por Cobrar Clientes
            $cuentaCobroId = $sale->es_credito
                ? ($config->cuenta_cuentas_por_cobrar_id ?? $config->cuenta_caja_id)
                : ($config->cuenta_caja_id);

            if ($cuentaCobroId) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $cuentaCobroId,
                    'tercero_type' => $sale->cliente_id ? Cliente::class : null,
                    'tercero_id' => $sale->cliente_id,
                    'debe' => $sale->total,
                    'haber' => 0.00,
                    'debe_usd' => $sale->total / $tasaDolar,
                    'haber_usd' => 0.00,
                    'referencia' => "Ticket {$sale->codigo_ticket}",
                ]);
            }

            // 2. HABER: Ingresos diferenciados por tipo de ítem (Producto vs Servicio Técnico)
            $sale->loadMissing('items.itemable');
            $totalProductos = 0;
            $totalServicios = 0;
            $costoProductos = 0;
            $costoRepuestos = 0;

            foreach ($sale->items as $item) {
                $subtotalItem = (float) $item->subtotal;
                $costoUnitario = (float) ($item->itemable?->costo_compra ?? 0);
                $cant = (float) $item->cantidad;

                if ($item->concepto_tipo === 'servicio') {
                    $totalServicios += $subtotalItem;
                    $costoRepuestos += ($costoUnitario * $cant);
                } else {
                    $totalProductos += $subtotalItem;
                    $costoProductos += ($costoUnitario * $cant);
                }
            }

            if ($totalProductos > 0 && $config->cuenta_ventas_productos_id) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_ventas_productos_id,
                    'debe' => 0.00,
                    'haber' => $totalProductos,
                    'debe_usd' => 0.00,
                    'haber_usd' => $totalProductos / $tasaDolar,
                    'referencia' => 'Venta Productos POS',
                ]);
            }

            if ($totalServicios > 0 && $config->cuenta_ventas_servicios_id) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_ventas_servicios_id,
                    'debe' => 0.00,
                    'haber' => $totalServicios,
                    'debe_usd' => 0.00,
                    'haber_usd' => $totalServicios / $tasaDolar,
                    'referencia' => 'Servicio Técnico / Mano de Obra',
                ]);
            }

            // 3. ASISTENCIA DE COSTO DE VENTAS E INVENTARIO
            if ($costoProductos > 0 && $config->cuenta_costo_ventas_productos_id && $config->cuenta_inventario_productos_id) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_costo_ventas_productos_id,
                    'debe' => $costoProductos,
                    'haber' => 0.00,
                    'debe_usd' => $costoProductos / $tasaDolar,
                    'haber_usd' => 0.00,
                    'referencia' => 'Costo de Venta Productos',
                ]);

                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_inventario_productos_id,
                    'debe' => 0.00,
                    'haber' => $costoProductos,
                    'debe_usd' => 0.00,
                    'haber_usd' => $costoProductos / $tasaDolar,
                    'referencia' => 'Salida Inventario Productos',
                ]);
            }

            if ($costoRepuestos > 0 && $config->cuenta_costo_repuestos_id && $config->cuenta_inventario_repuestos_id) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_costo_repuestos_id,
                    'debe' => $costoRepuestos,
                    'haber' => 0.00,
                    'debe_usd' => $costoRepuestos / $tasaDolar,
                    'haber_usd' => 0.00,
                    'referencia' => 'Costo Repuestos Taller',
                ]);

                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_inventario_repuestos_id,
                    'debe' => 0.00,
                    'haber' => $costoRepuestos,
                    'debe_usd' => 0.00,
                    'haber_usd' => $costoRepuestos / $tasaDolar,
                    'referencia' => 'Salida Inventario Repuestos',
                ]);
            }

            return $asiento;
        });
    }

    /**
     * Contabilizar automáticamente una Compra a Proveedor.
     */
    public function recordPurchaseEntry(Compra $compra): ?AsientoContable
    {
        if (!$compra->empresa_id) return null;

        $config = $this->getConfig($compra->empresa_id);
        if (!$config || !$config->contabilidad_automatica) return null;

        return DB::transaction(function () use ($compra, $config) {
            $tasaDolar = (float) ($compra->empresa?->valor_dolar ?? 20.0);
            if ($tasaDolar <= 0) $tasaDolar = 1.0;

            $asiento = AsientoContable::create([
                'empresa_id' => $compra->empresa_id,
                'sucursal_id' => $compra->sucursal_id,
                'numero_asiento' => 'AST-CMP-' . str_pad($compra->id, 6, '0', STR_PAD_LEFT),
                'fecha' => $compra->fecha_emision ?? now(),
                'glosa' => "Compra #{$compra->codigo_compra} - Proveedor {$compra->proveedor?->razon_social}",
                'origen_type' => Compra::class,
                'origen_id' => $compra->id,
                'tasa_cambio' => $tasaDolar,
                'estado' => 'contabilizado',
                'created_by' => $compra->user_id,
            ]);

            // DEBE: Inventario de Productos
            if ($config->cuenta_inventario_productos_id) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $config->cuenta_inventario_productos_id,
                    'debe' => $compra->monto_total,
                    'haber' => 0.00,
                    'debe_usd' => $compra->monto_total / $tasaDolar,
                    'haber_usd' => 0.00,
                    'referencia' => "Compra {$compra->codigo_compra}",
                ]);
            }

            // HABER: Proveedores (CxP) o Caja
            $cuentaPagoId = ($compra->saldo_pendiente > 0)
                ? ($config->cuenta_cuentas_por_pagar_id ?? $config->cuenta_caja_id)
                : ($config->cuenta_caja_id);

            if ($cuentaPagoId) {
                ApunteContable::create([
                    'asiento_id' => $asiento->id,
                    'cuenta_id' => $cuentaPagoId,
                    'tercero_type' => Proveedor::class,
                    'tercero_id' => $compra->proveedor_id,
                    'debe' => 0.00,
                    'haber' => $compra->monto_total,
                    'debe_usd' => 0.00,
                    'haber_usd' => $compra->monto_total / $tasaDolar,
                    'referencia' => "Pago Compra {$compra->codigo_compra}",
                ]);
            }

            return $asiento;
        });
    }

    /**
     * Contabilizar un movimiento manual de caja (Gastos u Entradas rápidas).
     */
    public function recordCashMovementEntry(CashMovement $movement): ?AsientoContable
    {
        if (!$movement->cashRegister?->empresa_id) return null;

        $empresaId = $movement->cashRegister->empresa_id;
        $config = $this->getConfig($empresaId);
        if (!$config || !$config->contabilidad_automatica) return null;

        return DB::transaction(function () use ($movement, $empresaId, $config) {
            $tasaDolar = 20.0;
            $asiento = AsientoContable::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $movement->cashRegister->sucursal_id,
                'numero_asiento' => 'AST-CAJ-' . str_pad($movement->id, 6, '0', STR_PAD_LEFT),
                'fecha' => $movement->created_at ?? now(),
                'glosa' => "Movimiento de Caja ({$movement->type}): {$movement->concepto} - {$movement->description}",
                'origen_type' => CashMovement::class,
                'origen_id' => $movement->id,
                'tasa_cambio' => $tasaDolar,
                'estado' => 'contabilizado',
                'created_by' => $movement->user_id,
            ]);

            $amount = (float) $movement->amount;

            if ($movement->type === 'outflow') {
                // Egreso / Gasto: DEBE Gasto General, HABER Caja
                if ($config->cuenta_gastos_generales_id) {
                    ApunteContable::create([
                        'asiento_id' => $asiento->id,
                        'cuenta_id' => $config->cuenta_gastos_generales_id,
                        'debe' => $amount,
                        'haber' => 0.00,
                        'debe_usd' => $amount / $tasaDolar,
                        'haber_usd' => 0.00,
                    ]);
                }
                if ($config->cuenta_caja_id) {
                    ApunteContable::create([
                        'asiento_id' => $asiento->id,
                        'cuenta_id' => $config->cuenta_caja_id,
                        'debe' => 0.00,
                        'haber' => $amount,
                        'debe_usd' => 0.00,
                        'haber_usd' => $amount / $tasaDolar,
                    ]);
                }
            } else {
                // Ingreso: DEBE Caja, HABER Gastos/Ingresos
                if ($config->cuenta_caja_id) {
                    ApunteContable::create([
                        'asiento_id' => $asiento->id,
                        'cuenta_id' => $config->cuenta_caja_id,
                        'debe' => $amount,
                        'haber' => 0.00,
                        'debe_usd' => $amount / $tasaDolar,
                        'haber_usd' => 0.00,
                    ]);
                }
                if ($config->cuenta_ventas_productos_id) {
                    ApunteContable::create([
                        'asiento_id' => $asiento->id,
                        'cuenta_id' => $config->cuenta_ventas_productos_id,
                        'debe' => 0.00,
                        'haber' => $amount,
                        'debe_usd' => 0.00,
                        'haber_usd' => $amount / $tasaDolar,
                    ]);
                }
            }

            return $asiento;
        });
    }

    /**
     * Registrar asiento contable manual de partida doble.
     */
    public function recordManualEntry(array $data, int $empresaId, int $userId): AsientoContable
    {
        return DB::transaction(function () use ($data, $empresaId, $userId) {
            $tasaDolar = 36.50;
            $count = AsientoContable::withoutGlobalScopes()->where('empresa_id', $empresaId)->count();
            $numeroAsiento = 'AS-MNL-' . date('Y') . '-' . str_pad($count + 1, 5, '0', STR_PAD_LEFT);

            $asiento = AsientoContable::create([
                'empresa_id' => $empresaId,
                'numero_asiento' => $numeroAsiento,
                'fecha' => $data['fecha'] ?? now(),
                'glosa' => $data['glosa'],
                'tasa_cambio' => $tasaDolar,
                'origen_tipo' => 'manual',
                'origen_id' => null,
                'user_id' => $userId,
                'estado' => 'asentado',
            ]);

            foreach ($data['apuntes'] as $item) {
                $debe = (float) ($item['debe'] ?? 0);
                $haber = (float) ($item['haber'] ?? 0);

                if ($debe > 0 || $haber > 0) {
                    ApunteContable::create([
                        'asiento_id' => $asiento->id,
                        'cuenta_id' => $item['cuenta_id'],
                        'debe' => $debe,
                        'haber' => $haber,
                        'debe_usd' => $debe / $tasaDolar,
                        'haber_usd' => $haber / $tasaDolar,
                        'referencia' => $item['referencia'] ?? null,
                    ]);
                }
            }

            return $asiento;
        });
    }

    /**
     * Cierre de Ejercicio Contable (Liquidar cuentas de resultado)
     */
    public function closeFiscalPeriod(int $empresaId, int $userId): ?AsientoContable
    {
        return DB::transaction(function () use ($empresaId, $userId) {
            $totalIngresos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'ingreso'))->sum('haber');
            $totalGastosCostos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->whereIn('tipo', ['costo', 'gasto']))->sum('debe');

            $utilidadNeta = $totalIngresos - $totalGastosCostos;
            if (abs($utilidadNeta) < 0.01) {
                return null;
            }

            $cuentaPatrimonio = CuentaContable::where('tipo', 'patrimonio')->where('acepta_movimiento', true)->first();
            if (!$cuentaPatrimonio) {
                return null;
            }

            $tasaDolar = 36.50;
            $count = AsientoContable::withoutGlobalScopes()->where('empresa_id', $empresaId)->count();
            $numeroAsiento = 'AS-CIERRE-' . date('Y') . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

            $asiento = AsientoContable::create([
                'empresa_id' => $empresaId,
                'numero_asiento' => $numeroAsiento,
                'fecha' => now(),
                'glosa' => 'Asiento de Cierre de Ejercicio Económico - Liquidación de Cuentas de Resultado',
                'tasa_cambio' => $tasaDolar,
                'origen_tipo' => 'cierre',
                'origen_id' => null,
                'user_id' => $userId,
                'estado' => 'asentado',
            ]);

            ApunteContable::create([
                'asiento_id' => $asiento->id,
                'cuenta_id' => $cuentaPatrimonio->id,
                'debe' => $utilidadNeta > 0 ? 0 : abs($utilidadNeta),
                'haber' => $utilidadNeta > 0 ? $utilidadNeta : 0,
                'debe_usd' => $utilidadNeta > 0 ? 0 : abs($utilidadNeta) / $tasaDolar,
                'haber_usd' => $utilidadNeta > 0 ? $utilidadNeta / $tasaDolar : 0,
                'referencia' => 'Cierre de Ejercicio',
            ]);

            return $asiento;
        });
    }
}
