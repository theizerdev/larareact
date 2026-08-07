<?php

namespace App\Services;

use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
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
}
