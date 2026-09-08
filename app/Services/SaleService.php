<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\InventoryMovement;
use App\Models\OrdenReparacion;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
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

            $cashRegister = CashRegister::getActiveRegister($user);

            // Generate unique ticket code
            $lastSale = Sale::orderBy('id', 'desc')->first();
            $nextNum = ($lastSale ? $lastSale->id : 0) + 1;
            $codigoTicket = 'VTA-' . str_pad($nextNum, 6, '0', STR_PAD_LEFT);

            // Compute totals
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $subtotal += $item['precio_unitario'] * $item['cantidad'];
            }
            // Obtener país y tasa predeterminada de la empresa
            $empresa = Empresa::with('pais')->find(\Auth::user()->empresa_id);
            $tasaPais = (float) ($empresa?->pais?->impuesto_predeterminado ?? 16.00);

            $descuento = (float) ($data['descuento'] ?? 0);
            
            if (isset($data['impuesto']) && $data['impuesto'] !== null && $data['impuesto'] !== '') {
                $impuesto = (float) $data['impuesto'];
            } else {
                // Calcular impuesto automáticamente basado en la tasa oficial del país de la empresa
                $impuesto = round(($subtotal - $descuento) * ($tasaPais / 100), 2);
            }

            $total = $subtotal + $impuesto - $descuento;

            // Determine if it's a credit sale
            $esCredito = (bool) ($data['es_credito'] ?? false);
            $payments = $data['payments'] ?? [];

            // If no explicit payments array, build from single metodo_pago
            if (empty($payments)) {
                $payments = [
                    ['metodo_pago' => $data['metodo_pago'] ?? 'efectivo', 'monto' => $total],
                ];
            }

            $totalPaid = array_sum(array_column($payments, 'monto'));
            $saldoCredito = $esCredito ? max(0, $total - $totalPaid) : 0;
            $montoRecibido = $totalPaid;
            $cambio = max(0, $montoRecibido - $total);
            if ($esCredito) {
                $cambio = 0;
            }

            // Primary payment method (highest amount)
            $primaryMethod = 'efectivo';
            if (!empty($payments)) {
                usort($payments, fn($a, $b) => $b['monto'] <=> $a['monto']);
                $primaryMethod = $payments[0]['metodo_pago'];
            }

            // Autodetectar cliente desde la orden de reparación si no se especificó un cliente en el ticket POS
            if (empty($data['cliente_id']) || empty($data['cliente_nombre']) || $data['cliente_nombre'] === 'Cliente General') {
                foreach ($data['items'] as $item) {
                    if (in_array($item['concepto_tipo'] ?? '', ['reparacion', 'reparacion_anticipo', 'reparacion_liquidacion']) && !empty($item['itemable_id'])) {
                        $repObj = OrdenReparacion::find($item['itemable_id']);
                        if ($repObj) {
                            $data['cliente_id'] = $data['cliente_id'] ?? $repObj->cliente_id;
                            $data['cliente_nombre'] = ($data['cliente_nombre'] && $data['cliente_nombre'] !== 'Cliente General') 
                                ? $data['cliente_nombre'] 
                                : ($repObj->cliente_nombre ?? 'Cliente General');
                            break;
                        }
                    }
                }
            }

            // Create Sale record
            $sale = Sale::create([
                'empresa_id' => $user?->empresa_id,
                'sucursal_id' => $user?->sucursal_id,
                'cash_register_id' => $cashRegister?->id,
                'user_id' => $userId,
                'cliente_id' => $data['cliente_id'] ?? null,
                'codigo_ticket' => $codigoTicket,
                'cliente_nombre' => $data['cliente_nombre'] ?? 'Cliente General',
                'metodo_pago' => $primaryMethod,
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'descuento' => $descuento,
                'total' => $total,
                'monto_recibido' => $montoRecibido,
                'cambio' => $cambio,
                'estado' => 'completada',
                'es_credito' => $esCredito,
                'saldo_credito' => $saldoCredito,
                'notas' => $data['notas'] ?? null,
            ]);

            // Create sale payment records
            foreach ($payments as $payment) {
                if ((float) $payment['monto'] > 0) {
                    SalePayment::create([
                        'sale_id' => $sale->id,
                        'metodo_pago' => $payment['metodo_pago'],
                        'monto' => (float) $payment['monto'],
                    ]);
                }
            }

            // Create Sale items & adjust product stock
            foreach ($data['items'] as $item) {
                $itemSubtotal = $item['precio_unitario'] * $item['cantidad'];

                $itemableType = null;
                $itemableId = null;

                if (($item['concepto_tipo'] ?? 'producto') === 'producto' && !empty($item['itemable_id'])) {
                    $itemableType = Producto::class;
                    $itemableId = $item['itemable_id'];

                    $producto = Producto::find($item['itemable_id']);
                    if ($producto && $producto->usa_inventario) {
                        $producto->decrement('stock', $item['cantidad']);
                    }
                } elseif (($item['concepto_tipo'] ?? 'servicio') === 'servicio' && !empty($item['itemable_id'])) {
                    $itemableType = Servicio::class;
                    $itemableId = $item['itemable_id'];
                } elseif (in_array($item['concepto_tipo'] ?? '', ['reparacion', 'reparacion_anticipo', 'reparacion_liquidacion']) && !empty($item['itemable_id'])) {
                    $itemableType = OrdenReparacion::class;
                    $itemableId = $item['itemable_id'];

                    $reparacion = OrdenReparacion::find($item['itemable_id']);
                    if ($reparacion) {
                        $montoPago = (float) $itemSubtotal;
                        $estadoAnterior = $reparacion->estado_orden;

                        if (($item['concepto_tipo'] ?? '') === 'reparacion_anticipo') {
                            $nuevoAnticipo = (float) $reparacion->anticipo + $montoPago;
                            $costoTotal = (float) max(
                                $reparacion->costo_estimado ?? 0,
                                ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
                            );
                            $costoTotal = $costoTotal > 0 ? $costoTotal : $nuevoAnticipo;
                            $nuevoSaldo = max(0, $costoTotal - $nuevoAnticipo);

                            $reparacion->anticipo = $nuevoAnticipo;
                            $reparacion->saldo_restante = $nuevoSaldo;

                            $isFinalizado = false;
                            if ($nuevoSaldo <= 0) {
                                $reparacion->sale_id = $sale->id;
                                $reparacion->estado_orden = 'entregado_finalizado';
                                if (!$reparacion->fecha_entrega) {
                                    $reparacion->fecha_entrega = now();
                                }
                                $isFinalizado = true;
                            }
                            $reparacion->save();

                            \App\Models\OrdenReparacionHistorial::create([
                                'orden_id' => $reparacion->id,
                                'user_id' => $userId,
                                'estado_anterior' => $estadoAnterior,
                                'estado_nuevo' => $reparacion->estado_orden,
                                'comentario' => "Abono / Anticipo de {$montoPago} registrado desde el Punto de Venta (Ticket: {$codigoTicket})." . ($isFinalizado ? " Saldo cubierto en su totalidad: orden actualizada automáticamente a ENTREGADO/FINALIZADO." : ""),
                            ]);
                        } else {
                            // Liquidación final / Cobro total de orden de reparación
                            $costoTotal = (float) max(
                                $reparacion->costo_estimado ?? 0,
                                ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
                            );
                            $nuevoAnticipo = $costoTotal > 0 ? $costoTotal : ((float) $reparacion->anticipo + $montoPago);

                            $reparacion->sale_id = $sale->id;
                            $reparacion->anticipo = $nuevoAnticipo;
                            $reparacion->saldo_restante = 0.00;
                            $reparacion->estado_orden = 'entregado_finalizado';
                            if (!$reparacion->fecha_entrega) {
                                $reparacion->fecha_entrega = now();
                            }
                            $reparacion->save();

                            \App\Models\OrdenReparacionHistorial::create([
                                'orden_id' => $reparacion->id,
                                'user_id' => $userId,
                                'estado_anterior' => $estadoAnterior,
                                'estado_nuevo' => 'entregado_finalizado',
                                'comentario' => "Cobro de orden ({$montoPago}) registrado desde el Punto de Venta (Ticket: {$codigoTicket}). Estado actualizado automáticamente a ENTREGADO/FINALIZADO.",
                            ]);
                        }
                    }
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

            // Record cash register inflows (one per payment method)
            if ($cashRegister) {
                foreach ($payments as $payment) {
                    if ((float) $payment['monto'] > 0) {
                        $this->cashRegisterService->addMovement(
                            $cashRegister,
                            'inflow',
                            'venta',
                            $payment['metodo_pago'],
                            (float) $payment['monto'],
                            "Venta {$codigoTicket} - {$sale->cliente_nombre}",
                            $userId
                        );
                    }
                }
            }

            // Update client credit balance if credit sale
            if ($esCredito && !empty($data['cliente_id']) && $saldoCredito > 0) {
                $cliente = Cliente::find($data['cliente_id']);
                if ($cliente) {
                    $cliente->increment('saldo_pendiente', $saldoCredito);
                }
            }

            // Contabilización Automática por Partida Doble
            try {
                app(\App\Services\AccountingService::class)->recordSaleEntry($sale);
            } catch (\Throwable $e) {
                // Registro contable silencioso ante fallos secundarios
            }

            return $sale;
        });
    }

    /**
     * Anula una venta, revierte existencias en inventario, movimientos de caja y órdenes de reparación.
     */
    public function cancelSale(Sale $sale, int $userId): Sale
    {
        if ($sale->estado === 'anulada') {
            return $sale;
        }

        return DB::transaction(function () use ($sale, $userId) {
            $sale->loadMissing(['items', 'payments']);

            // 1. Revertir inventario de productos y reparaciones asociadas
            foreach ($sale->items as $item) {
                if (($item->concepto_tipo ?? 'producto') === 'producto' && !empty($item->itemable_id)) {
                    $producto = Producto::find($item->itemable_id);
                    if ($producto && $producto->usa_inventario) {
                        $oldStock = (float) ($producto->stock ?? 0);
                        $qty = (float) $item->cantidad;
                        $newStock = $oldStock + $qty;

                        $producto->update(['stock' => $newStock]);

                        InventoryMovement::create([
                            'empresa_id' => $sale->empresa_id,
                            'sucursal_id' => $sale->sucursal_id,
                            'producto_id' => $producto->id,
                            'user_id' => $userId,
                            'tipo' => 'entrada',
                            'motivo' => 'anulacion_venta',
                            'cantidad' => $qty,
                            'stock_anterior' => $oldStock,
                            'stock_nuevo' => $newStock,
                            'costo_unitario' => (float) ($producto->precio_costo ?? 0),
                            'referencia' => "Anulación Venta {$sale->codigo_ticket}",
                            'notas' => "Venta {$sale->codigo_ticket} anulada desde POS - existencias devueltas a inventario",
                        ]);
                    }
                } elseif (in_array($item->concepto_tipo ?? '', ['reparacion', 'reparacion_anticipo', 'reparacion_liquidacion']) && !empty($item->itemable_id)) {
                    $reparacion = OrdenReparacion::find($item->itemable_id);
                    if ($reparacion) {
                        $montoPago = (float) $item->subtotal;
                        $estadoAnterior = $reparacion->estado_orden;

                        if (($item->concepto_tipo ?? '') === 'reparacion_anticipo') {
                            $nuevoAnticipo = max(0, (float) $reparacion->anticipo - $montoPago);
                            $costoTotal = (float) max(
                                $reparacion->costo_estimado ?? 0,
                                ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
                            );
                            $nuevoSaldo = max(0, $costoTotal - $nuevoAnticipo);

                            $reparacion->anticipo = $nuevoAnticipo;
                            $reparacion->saldo_restante = $nuevoSaldo;

                            if (in_array($reparacion->estado_orden, ['entregado_finalizado', 'entregado'])) {
                                $reparacion->estado_orden = 'listo_reparado';
                                $reparacion->sale_id = null;
                                $reparacion->fecha_entrega = null;
                            }
                            $reparacion->save();

                            \App\Models\OrdenReparacionHistorial::create([
                                'orden_id' => $reparacion->id,
                                'user_id' => $userId,
                                'estado_anterior' => $estadoAnterior,
                                'estado_nuevo' => $reparacion->estado_orden,
                                'comentario' => "Venta {$sale->codigo_ticket} anulada desde POS. Anticipo de {$montoPago} revertido y saldo pendiente restaurado a {$nuevoSaldo}.",
                            ]);
                        } else {
                            // Liquidación final revertida
                            $costoTotal = (float) max(
                                $reparacion->costo_estimado ?? 0,
                                ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
                            );
                            $reparacion->sale_id = null;
                            $reparacion->saldo_restante = $montoPago;
                            if (in_array($reparacion->estado_orden, ['entregado_finalizado', 'entregado'])) {
                                $reparacion->estado_orden = 'listo_reparado';
                                $reparacion->fecha_entrega = null;
                            }
                            $reparacion->save();

                            \App\Models\OrdenReparacionHistorial::create([
                                'orden_id' => $reparacion->id,
                                'user_id' => $userId,
                                'estado_anterior' => $estadoAnterior,
                                'estado_nuevo' => $reparacion->estado_orden,
                                'comentario' => "Venta {$sale->codigo_ticket} anulada desde POS. Liquidación de {$montoPago} revertida y orden reabierta a LISTO/REPARADO.",
                            ]);
                        }
                    }
                }
            }

            // 2. Revertir ingresos en caja registradora registrando salidas compensatorias
            if ($sale->cash_register_id) {
                $cashRegister = CashRegister::find($sale->cash_register_id);
                if ($cashRegister) {
                    foreach ($sale->payments as $payment) {
                        if ((float) $payment->monto > 0) {
                            $this->cashRegisterService->addMovement(
                                $cashRegister,
                                'outflow',
                                'anulacion_venta',
                                $payment->metodo_pago,
                                (float) $payment->monto,
                                "Anulación Venta {$sale->codigo_ticket} - Reversión pago {$sale->cliente_nombre}",
                                $userId
                            );
                        }
                    }
                }
            }

            // 3. Revertir saldo pendiente de cliente si fue venta a crédito
            if ($sale->es_credito && !empty($sale->cliente_id) && (float) $sale->saldo_credito > 0) {
                $cliente = Cliente::find($sale->cliente_id);
                if ($cliente) {
                    $cliente->decrement('saldo_pendiente', (float) $sale->saldo_credito);
                }
            }

            // 4. Marcar venta como anulada
            $sale->update(['estado' => 'anulada']);

            return $sale;
        });
    }
}
