<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProveedorResource extends JsonResource
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
            'razon_social' => $this->razon_social,
            'nombre_comercial' => $this->nombre_comercial,
            'rif_documento' => $this->rif_documento,
            'contacto_nombre' => $this->contacto_nombre,
            'telefono' => $this->telefono,
            'email' => $this->email,
            'direccion' => $this->direccion,
            'categoria_insumos' => $this->categoria_insumos,
            'notas' => $this->notas,
            'estado' => (bool) $this->estado,
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
