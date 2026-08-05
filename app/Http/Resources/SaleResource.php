<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'codigo_ticket' => $this->codigo_ticket,
            'cliente_nombre' => $this->cliente_nombre,
            'cliente_id' => $this->cliente_id,
            'metodo_pago' => $this->metodo_pago,
            'subtotal' => (float) $this->subtotal,
            'impuesto' => (float) $this->impuesto,
            'descuento' => (float) $this->descuento,
            'total' => (float) $this->total,
            'monto_recibido' => (float) $this->monto_recibido,
            'cambio' => (float) $this->cambio,
            'es_credito' => (bool) $this->es_credito,
            'saldo_credito' => (float) $this->saldo_credito,
            'estado' => $this->estado,
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'concepto_tipo' => $item->concepto_tipo,
                'nombre' => $item->nombre,
                'cantidad' => (int) $item->cantidad,
                'precio_unitario' => (float) $item->precio_unitario,
                'subtotal' => (float) $item->subtotal,
            ])),
            'payments' => $this->whenLoaded('payments', fn () => $this->payments->map(fn ($p) => [
                'id' => $p->id,
                'metodo_pago' => $p->metodo_pago,
                'monto' => (float) $p->monto,
            ])),
        ];
    }
}
