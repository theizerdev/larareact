<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\Producto;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Registra un movimiento de inventario en el Kardex.
     */
    public function recordMovement(
        Producto $producto,
        string $tipo,
        float $cantidad,
        string $motivo,
        ?string $referencia = null,
        ?string $notas = null,
        ?float $costoUnitario = null
    ): ?InventoryMovement {
        if (! $producto->usa_inventario || $cantidad <= 0) {
            return null;
        }

        return DB::transaction(function () use ($producto, $tipo, $cantidad, $motivo, $referencia, $notas, $costoUnitario) {
            $stockAnterior = (float) $producto->stock;
            $stockNuevo = $tipo === 'entrada' ? $stockAnterior + $cantidad : max(0, $stockAnterior - $cantidad);

            // Actualizar stock del producto si no ha sido actualizado previamente
            $producto->update(['stock' => $stockNuevo]);

            return InventoryMovement::create([
                'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
                'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => auth()->id(),
                'tipo' => $tipo,
                'motivo' => $motivo,
                'cantidad' => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'costo_unitario' => $costoUnitario ?? (float) $producto->precio_compra,
                'referencia' => $referencia,
                'notas' => $notas,
            ]);
        });
    }

    /**
     * Registra el stock inicial al dar de alta un producto.
     */
    public function recordInitialStock(Producto $producto): ?InventoryMovement
    {
        if (! $producto->usa_inventario || $producto->stock <= 0) {
            return null;
        }

        return InventoryMovement::create([
            'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
            'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
            'producto_id' => $producto->id,
            'user_id' => auth()->id(),
            'tipo' => 'entrada',
            'motivo' => __('Inventario Inicial de Registro'),
            'cantidad' => (float) $producto->stock,
            'stock_anterior' => 0,
            'stock_nuevo' => (float) $producto->stock,
            'costo_unitario' => (float) $producto->precio_compra,
            'referencia' => 'ALTA-' . $producto->sku,
            'notas' => __('Registro de stock inicial al crear el producto en el catálogo.'),
        ]);
    }

    /**
     * Registra un ajuste manual de stock por edición directa.
     */
    public function recordStockAdjustment(Producto $producto, float $stockAnterior, float $stockNuevo): ?InventoryMovement
    {
        if (! $producto->usa_inventario || $stockAnterior === $stockNuevo) {
            return null;
        }

        $diferencia = $stockNuevo - $stockAnterior;
        $tipo = $diferencia > 0 ? 'entrada' : 'salida';

        return InventoryMovement::create([
            'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
            'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
            'producto_id' => $producto->id,
            'user_id' => auth()->id(),
            'tipo' => $tipo,
            'motivo' => __('Ajuste Directo (Edición de Producto)'),
            'cantidad' => abs($diferencia),
            'stock_anterior' => $stockAnterior,
            'stock_nuevo' => $stockNuevo,
            'costo_unitario' => (float) $producto->precio_compra,
            'referencia' => 'EDIT-' . $producto->sku,
            'notas' => __('Modificación manual de cantidad realizada desde el catálogo de productos.'),
        ]);
    }
}
