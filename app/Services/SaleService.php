<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\SaleItem;

use App\Models\Servicio;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SaleService
{
    protected CashRegisterService $cashRegisterService;

    public function __construct(CashRegisterService $cashRegisterService)
    {
        $this->cashRegisterService = $cashRegisterService;
    }

    public function processSale(array $data, int $userId): Sale
    {
        return DB::transaction(function () use ($data, $userId) {
            $user = User::find($userId);

            // Fetch current active cash register
            $cashRegister = CashRegister::where('user_id', $userId)
                ->where('status', 'open')
                ->first();

            // Generate unique ticket code
            $count = Sale::count() + 1;
            $codigoTicket = 'VTA-' . str_pad($count, 6, '0', STR_PAD_LEFT);

            // Compute totals
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['precio_unitario'] * $item['cantidad'];
            }
            $descuento = (float) ($data['descuento'] ?? 0);
            $impuesto = (float) ($data['impuesto'] ?? 0);
            $total = $subtotal + $impuesto - $descuento;
            $montoRecibido = (float) ($data['monto_recibido'] ?? $total);
            $cambio = max(0, $montoRecibido - $total);

            // Create Sale record
            $sale = Sale::create([
                'empresa_id' => $user?->empresa_id,
                'sucursal_id' => $user?->sucursal_id,
                'cash_register_id' => $cashRegister?->id,
                'user_id' => $userId,
                'codigo_ticket' => $codigoTicket,
                'cliente_nombre' => $data['cliente_nombre'] ?? 'Cliente General',
                'metodo_pago' => $data['metodo_pago'] ?? 'efectivo',
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'descuento' => $descuento,
                'total' => $total,
                'monto_recibido' => $montoRecibido,
                'cambio' => $cambio,
                'estado' => 'completada',
                'notas' => $data['notas'] ?? null,
            ]);

            // Create Sale items & adjust product stock
            foreach ($data['items'] as $item) {
                $itemSubtotal = $item['precio_unitario'] * $item['cantidad'];

                $itemableType = null;
                $itemableId = null;

                if (($item['concepto_tipo'] ?? 'producto') === 'producto' && !empty($item['itemable_id'])) {
                    $itemableType = Producto::class;
                    $itemableId = $item['itemable_id'];

                    // Deduct stock if column stock exists
                    $producto = Producto::find($item['itemable_id']);
                    if ($producto && isset($producto->stock)) {
                        $producto->decrement('stock', $item['cantidad']);
                    }
                } elseif (($item['concepto_tipo'] ?? 'servicio') === 'servicio' && !empty($item['itemable_id'])) {
                    $itemableType = Servicio::class;
                    $itemableId = $item['itemable_id'];
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'itemable_type' => $itemableType,
                    'itemable_id' => $itemableId,
                    'concepto_tipo' => $item['concepto_tipo'] ?? 'producto',
                    'nombre' => $item['nombre'],
                    'cantidad' => $item['cantidad'],
                    'precio_unitario' => $item['precio_unitario'],
                    'subtotal' => $itemSubtotal,
                ]);
            }

            // Record cash register inflow if register is open
            if ($cashRegister && $total > 0) {
                $conceptoVal = 'venta';
                $this->cashRegisterService->addMovement(
                    $cashRegister,
                    'inflow',
                    $conceptoVal,
                    $data['metodo_pago'] ?? 'efectivo',
                    $total,
                    "Venta {$codigoTicket} - {$sale->cliente_nombre}",
                    $userId
                );
            }

            return $sale;
        });
    }
}
