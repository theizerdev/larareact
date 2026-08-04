<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\Compra;
use App\Models\CompraItem;
use App\Models\CompraPago;
use App\Models\InventoryMovement;
use App\Models\Producto;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    protected CashRegisterService $cashRegisterService;

    public function __construct(CashRegisterService $cashRegisterService)
    {
        $this->cashRegisterService = $cashRegisterService;
    }

    /**
     * Registra una nueva compra de insumos/productos
     */
    public function createPurchase(array $data, int $userId): Compra
    {
        return DB::transaction(function () use ($data, $userId) {
            $user = User::find($userId);
            $empresaId = $user?->empresa_id;
            $sucursalId = $data['sucursal_id'] ?? $user?->sucursal_id;

            $items = $data['items'] ?? [];
            $subtotal = 0;
            $impuestoTotal = 0;

            foreach ($items as $item) {
                $cant = (float) ($item['cantidad'] ?? 1);
                $costo = (float) ($item['costo_unitario'] ?? 0);
                $imp = (float) ($item['impuesto_unitario'] ?? 0);
                $subtotal += ($cant * $costo);
                $impuestoTotal += ($cant * $imp);
            }

            $descuento = (float) ($data['descuento'] ?? 0);
            $total = max(0, ($subtotal + $impuestoTotal) - $descuento);

            $tipoPago = $data['tipo_pago'] ?? 'contado';
            $initialPayment = (float) ($data['monto_inicial_pagado'] ?? ($tipoPago === 'contado' ? $total : 0));
            $initialPayment = min($total, $initialPayment);
            $saldoPendiente = max(0, $total - $initialPayment);

            $codigoCompra = 'CMP-' . date('Ymd') . '-' . sprintf('%04d', rand(1, 9999));

            $compra = Compra::create([
                'empresa_id' => $empresaId,
                'sucursal_id' => $sucursalId,
                'proveedor_id' => $data['proveedor_id'],
                'user_id' => $userId,
                'codigo_compra' => $codigoCompra,
                'numero_factura' => $data['numero_factura'] ?? null,
                'numero_control' => $data['numero_control'] ?? null,
                'tipo_pago' => $tipoPago,
                'fecha_emision' => $data['fecha_emision'] ?? now()->toDateString(),
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'status' => 'completada',
                'subtotal' => $subtotal,
                'impuesto' => $impuestoTotal,
                'descuento' => $descuento,
                'total' => $total,
                'monto_pagado' => $initialPayment,
                'saldo_pendiente' => $saldoPendiente,
                'notas' => $data['notas'] ?? null,
            ]);

            // Guardar ítems e incrementar stock en inventario
            foreach ($items as $item) {
                $cant = (float) ($item['cantidad'] ?? 1);
                $costo = (float) ($item['costo_unitario'] ?? 0);
                $imp = (float) ($item['impuesto_unitario'] ?? 0);
                $itemSubtotal = $cant * $costo;
                $itemTotal = $itemSubtotal + ($cant * $imp);

                CompraItem::create([
                    'compra_id' => $compra->id,
                    'producto_id' => $item['producto_id'],
                    'cantidad' => $cant,
                    'costo_unitario' => $costo,
                    'impuesto_unitario' => $imp,
                    'subtotal' => $itemSubtotal,
                    'total' => $itemTotal,
                ]);

                // Actualizar producto e inventario
                $producto = Producto::find($item['producto_id']);
                if ($producto) {
                    $oldStock = (float) ($producto->stock ?? 0);
                    $newStock = $oldStock + $cant;

                    $updateData = [
                        'stock' => $newStock,
                        'costo_compra' => $costo,
                    ];

                    if (! empty($item['update_sale_price']) && ! empty($item['nuevo_precio_venta'])) {
                        $updateData['precio_venta'] = (float) $item['nuevo_precio_venta'];
                    }

                    $producto->update($updateData);

                    // Movimiento de Kardex
                    InventoryMovement::create([
                        'empresa_id' => $empresaId,
                        'sucursal_id' => $sucursalId,
                        'producto_id' => $producto->id,
                        'user_id' => $userId,
                        'type' => 'entrada_compra',
                        'quantity' => $cant,
                        'previous_stock' => $oldStock,
                        'new_stock' => $newStock,
                        'reference_type' => Compra::class,
                        'reference_id' => $compra->id,
                        'notes' => "Compra #{$compra->codigo_compra} - Factura {$compra->numero_factura}",
                    ]);
                }
            }

            // Registrar pago/salida de dinero si hubo pago inicial
            if ($initialPayment > 0) {
                $payFromCash = ! empty($data['pagar_con_caja']);
                $activeRegister = $payFromCash ? CashRegister::getActiveRegister($user) : null;

                CompraPago::create([
                    'compra_id' => $compra->id,
                    'proveedor_id' => $compra->proveedor_id,
                    'user_id' => $userId,
                    'cash_register_id' => $activeRegister?->id,
                    'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                    'monto' => $initialPayment,
                    'referencia' => $data['referencia_pago'] ?? null,
                    'notas' => 'Pago inicial al registrar la compra',
                ]);

                if ($activeRegister) {
                    $this->cashRegisterService->addMovement(
                        $activeRegister,
                        'outflow',
                        'compra_proveedor',
                        $data['metodo_pago'] ?? 'efectivo',
                        $initialPayment,
                        "Pago de Compra #{$compra->codigo_compra}",
                        $userId
                    );
                }
            }

            return $compra;
        });
    }

    /**
     * Anula una compra registrada y revierte el stock ingresado
     */
    public function cancelPurchase(Compra $compra, int $userId): Compra
    {
        if ($compra->status === 'anulada') {
            return $compra;
        }

        return DB::transaction(function () use ($compra, $userId) {
            $compra->loadMissing('items');

            foreach ($compra->items as $item) {
                $producto = Producto::find($item->producto_id);
                if ($producto) {
                    $oldStock = (float) ($producto->stock ?? 0);
                    $newStock = max(0, $oldStock - (float) $item->cantidad);

                    $producto->update(['stock' => $newStock]);

                    InventoryMovement::create([
                        'empresa_id' => $compra->empresa_id,
                        'sucursal_id' => $compra->sucursal_id,
                        'producto_id' => $producto->id,
                        'user_id' => $userId,
                        'type' => 'anulacion_compra',
                        'quantity' => -(float) $item->cantidad,
                        'previous_stock' => $oldStock,
                        'new_stock' => $newStock,
                        'reference_type' => Compra::class,
                        'reference_id' => $compra->id,
                        'notes' => "Anulación de Compra #{$compra->codigo_compra}",
                    ]);
                }
            }

            $compra->update(['status' => 'anulada']);

            return $compra;
        });
    }

    /**
     * Registra un abono/pago a una compra a crédito (CxP)
     */
    public function addPayment(Compra $compra, array $data, int $userId): CompraPago
    {
        return DB::transaction(function () use ($compra, $data, $userId) {
            $user = User::find($userId);
            $amount = (float) ($data['monto'] ?? 0);
            $amount = min((float) $compra->saldo_pendiente, $amount);

            if ($amount <= 0) {
                throw new \InvalidArgumentException('El monto abonado debe ser mayor a 0');
            }

            $payFromCash = ! empty($data['pagar_con_caja']);
            $activeRegister = $payFromCash ? CashRegister::getActiveRegister($user) : null;

            $pago = CompraPago::create([
                'compra_id' => $compra->id,
                'proveedor_id' => $compra->proveedor_id,
                'user_id' => $userId,
                'cash_register_id' => $activeRegister?->id,
                'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                'monto' => $amount,
                'referencia' => $data['referencia'] ?? null,
                'notas' => $data['notas'] ?? 'Abono a Cuenta por Pagar',
            ]);

            $nuevoPagado = (float) $compra->monto_pagado + $amount;
            $nuevoSaldo = max(0, (float) $compra->total - $nuevoPagado);

            $compra->update([
                'monto_pagado' => $nuevoPagado,
                'saldo_pendiente' => $nuevoSaldo,
            ]);

            if ($activeRegister) {
                $this->cashRegisterService->addMovement(
                    $activeRegister,
                    'outflow',
                    'pago_proveedor',
                    $data['metodo_pago'] ?? 'efectivo',
                    $amount,
                    "Abono CxP Compra #{$compra->codigo_compra}",
                    $userId
                );
            }

            return $pago;
        });
    }
}
