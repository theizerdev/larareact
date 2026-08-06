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

            // 1. Definición del catálogo base según el rubro
            $accountsTree = [
                // 1. ACTIVOS
                ['codigo' => '1', 'nombre' => 'ACTIVO', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '1.1', 'nombre' => 'ACTIVO CORRIENTE', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '1'],
                ['codigo' => '1.1.01', 'nombre' => 'Efectivo y Equivalentes de Efectivo', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '1.1'],
                ['codigo' => '1.1.01.01', 'nombre' => 'Caja General / POS', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '1.1.01', 'key' => 'caja'],
                ['codigo' => '1.1.01.02', 'nombre' => 'Bancos / Transferencias', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '1.1.01', 'key' => 'banco'],

                ['codigo' => '1.1.02', 'nombre' => 'Cuentas por Cobrar', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '1.1'],
                ['codigo' => '1.1.02.01', 'nombre' => 'Clientes / Cuentas por Cobrar POS', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '1.1.02', 'key' => 'cxc'],

                ['codigo' => '1.1.03', 'nombre' => 'Inventarios', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 3, 'acepta' => false, 'padre' => '1.1'],
                ['codigo' => '1.1.03.01', 'nombre' => 'Inventario de Productos y Mercadería', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '1.1.03', 'key' => 'inv_prod'],
                ['codigo' => '1.1.03.02', 'nombre' => 'Inventario de Repuestos e Insumos Taller', 'tipo' => 'activo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '1.1.03', 'key' => 'inv_rep'],

                // 2. PASIVOS
                ['codigo' => '2', 'nombre' => 'PASIVO', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '2.1', 'nombre' => 'PASIVO CORRIENTE', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '2'],
                ['codigo' => '2.1.01', 'nombre' => 'Cuentas por Pagar Comerciales', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 3, 'acepta' => false, 'padre' => '2.1'],
                ['codigo' => '2.1.01.01', 'nombre' => 'Proveedores y Cuentas por Pagar', 'tipo' => 'pasivo', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '2.1.01', 'key' => 'cxp'],

                // 3. PATRIMONIO
                ['codigo' => '3', 'nombre' => 'PATRIMONIO', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '3.1', 'nombre' => 'CAPITAL Y RESERVAS', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '3'],
                ['codigo' => '3.1.01', 'nombre' => 'Capital Social / Aportes de Socios', 'tipo' => 'patrimonio', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '3.1'],

                // 4. INGRESOS
                ['codigo' => '4', 'nombre' => 'INGRESOS', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '4.1', 'nombre' => 'INGRESOS OPERACIONALES', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 2, 'acepta' => false, 'padre' => '4'],
                ['codigo' => '4.1.01', 'nombre' => 'Ingresos por Venta de Productos', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '4.1', 'key' => 'vta_prod'],
                ['codigo' => '4.1.02', 'nombre' => 'Ingresos por Servicios Técnicos y Reparaciones', 'tipo' => 'ingreso', 'naturaleza' => 'acreedora', 'nivel' => 4, 'acepta' => true, 'padre' => '4.1', 'key' => 'vta_srv'],

                // 5. GASTOS Y COSTOS
                ['codigo' => '5', 'nombre' => 'COSTOS Y GASTOS', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 1, 'acepta' => false, 'padre' => null],
                ['codigo' => '5.1', 'nombre' => 'COSTOS OPERACIONALES', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '5'],
                ['codigo' => '5.1.01', 'nombre' => 'Costo de Ventas (Productos)', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '5.1', 'key' => 'cst_prod'],
                ['codigo' => '5.1.02', 'nombre' => 'Costo de Repuestos y Materiales de Taller', 'tipo' => 'costo', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '5.1', 'key' => 'cst_rep'],

                ['codigo' => '5.2', 'nombre' => 'GASTOS OPERACIONALES Y ADMINISTRATIVOS', 'tipo' => 'gasto', 'naturaleza' => 'deudora', 'nivel' => 2, 'acepta' => false, 'padre' => '5'],
                ['codigo' => '5.2.01', 'nombre' => 'Gastos Generales de Operación', 'tipo' => 'gasto', 'naturaleza' => 'deudora', 'nivel' => 4, 'acepta' => true, 'padre' => '5.2', 'key' => 'gastos'],
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
}
