<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompraResource extends JsonResource
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
            'codigo_compra' => $this->codigo_compra,
            'numero_factura' => $this->numero_factura,
            'numero_control' => $this->numero_control,
            'tipo_pago' => $this->tipo_pago,
            'fecha_emision' => $this->fecha_emision?->format('Y-m-d'),
            'fecha_vencimiento' => $this->fecha_vencimiento?->format('Y-m-d'),
            'status' => $this->status,
            'subtotal' => (float) $this->subtotal,
            'impuesto' => (float) $this->impuesto,
            'descuento' => (float) $this->descuento,
            'total' => (float) $this->total,
            'monto_pagado' => (float) $this->monto_pagado,
            'saldo_pendiente' => (float) $this->saldo_pendiente,
            'usar_fondo_mes' => (bool) $this->usar_fondo_mes,
            'notas' => $this->notas,
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'proveedor' => $this->whenLoaded('proveedor', fn () => [
                'id' => $this->proveedor->id,
                'razon_social' => $this->proveedor->razon_social,
                'nombre_comercial' => $this->proveedor->nombre_comercial,
            ]),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'id' => $item->id,
                'producto_id' => $item->producto_id,
                'cantidad' => (float) $item->cantidad,
                'costo_unitario' => (float) $item->costo_unitario,
                'impuesto_unitario' => (float) $item->impuesto_unitario,
                'subtotal' => (float) $item->subtotal,
            ])),
        ];
    }
}
