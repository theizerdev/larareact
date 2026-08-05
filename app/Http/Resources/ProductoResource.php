<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductoResource extends JsonResource
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
            'sku' => $this->sku,
            'codigo_barras' => $this->codigo_barras,
            'nombre_variante' => $this->nombre_variante,
            'condicion' => $this->condicion,
            'tipo_venta' => $this->tipo_venta,
            'usa_inventario' => (bool) $this->usa_inventario,
            'precio_compra' => (float) $this->precio_compra,
            'precio_venta' => (float) $this->precio_venta,
            'precio_mayoreo' => (float) $this->precio_mayoreo,
            'stock' => (float) $this->stock,
            'stock_minimo' => (float) $this->stock_minimo,
            'estado' => (bool) $this->estado,
            'specs_completas' => $this->specs_completas,
            'categoria' => $this->whenLoaded('categoria', fn () => [
                'id' => $this->categoria->id,
                'nombre' => $this->categoria->nombre,
            ]),
            'marca' => $this->whenLoaded('marca', fn () => [
                'id' => $this->marca->id,
                'nombre' => $this->marca->nombre,
            ]),
            'familia' => $this->whenLoaded('familia', fn () => [
                'id' => $this->familia->id,
                'nombre' => $this->familia->nombre,
            ]),
            'modelo' => $this->whenLoaded('modelo', fn () => [
                'id' => $this->modelo->id,
                'nombre_comercial' => $this->modelo->nombre_comercial,
                'codigo_modelo' => $this->modelo->codigo_modelo,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
