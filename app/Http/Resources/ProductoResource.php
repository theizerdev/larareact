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
            'id'                          => $this->id,
            'modelo_id'                   => $this->modelo_id,
            'categoria_id'                => $this->categoria_id,
            'marca_id'                    => $this->marca_id,
            'familia_id'                  => $this->familia_id,
            'sku'                         => $this->sku,
            'codigo_barras'               => $this->codigo_barras,
            'nombre_variante'             => $this->nombre_variante,
            'condicion'                   => $this->condicion,
            'tipo_producto'               => $this->tipo_producto ?? ($this->condicion === 'repuesto' ? 'repuesto' : 'venta'),
            'tipo_venta'                  => $this->tipo_venta,
            'usa_inventario'              => (bool) $this->usa_inventario,
            'variant_specs'               => $this->variant_specs ?? [],
            'precio_compra'               => (float) $this->precio_compra,
            'precio_venta'                => (float) $this->precio_venta,
            'precio_mayoreo'              => (float) $this->precio_mayoreo,
            'stock'                       => (float) $this->stock,
            'stock_minimo'                => (float) $this->stock_minimo,
            'tipo_impuesto'               => $this->tipo_impuesto,
            'tasa_iva'                    => (float) $this->tasa_iva,
            'aplica_impuesto_adicional'   => (bool) $this->aplica_impuesto_adicional,
            'tasa_impuesto_adicional'     => (float) $this->tasa_impuesto_adicional,
            'aplica_retencion'            => (bool) $this->aplica_retencion,
            'tasa_retencion'              => (float) $this->tasa_retencion,
            'precio_incluye_impuestos'    => (bool) $this->precio_incluye_impuestos,
            'clave_sat_producto'          => $this->clave_sat_producto,
            'clave_sat_unidad'            => $this->clave_sat_unidad,
            'objeto_impuesto_sat'         => $this->objeto_impuesto_sat,
            'estado'                      => (bool) $this->estado,
            'specs_completas'             => $this->specs_completas,

            // Relaciones directas del producto (para repuestos sin modelo)
            'categoria' => $this->whenLoaded('categoria', fn () => $this->categoria ? [
                'id'     => $this->categoria->id,
                'nombre' => $this->categoria->nombre,
            ] : null),
            'marca' => $this->whenLoaded('marca', fn () => $this->marca ? [
                'id'     => $this->marca->id,
                'nombre' => $this->marca->nombre,
            ] : null),
            'familia' => $this->whenLoaded('familia', fn () => $this->familia ? [
                'id'     => $this->familia->id,
                'nombre' => $this->familia->nombre,
            ] : null),

            // Relación con modelo (incluye IDs y sub-relaciones para el formulario)
            'modelo' => $this->whenLoaded('modelo', fn () => $this->modelo ? [
                'id'               => $this->modelo->id,
                'nombre_comercial' => $this->modelo->nombre_comercial,
                'codigo_modelo'    => $this->modelo->codigo_modelo,
                'marca_id'         => $this->modelo->marca_id,
                'familia_id'       => $this->modelo->familia_id,
                'categoria_id'     => $this->modelo->categoria_id,
                'specs_overrides'  => $this->modelo->specs_overrides ?? [],
                'marca'            => $this->modelo->marca ? [
                    'id'     => $this->modelo->marca->id,
                    'nombre' => $this->modelo->marca->nombre,
                ] : null,
                'categoria'        => $this->modelo->categoria ? [
                    'id'     => $this->modelo->categoria->id,
                    'nombre' => $this->modelo->categoria->nombre,
                ] : null,
                'familia'          => $this->modelo->familia ? [
                    'id'          => $this->modelo->familia->id,
                    'nombre'      => $this->modelo->familia->nombre,
                    'specs_json'  => $this->modelo->familia->specs_json ?? [],
                ] : null,
            ] : null),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
