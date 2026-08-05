<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SucursalResource extends JsonResource
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
            'nombre' => $this->nombre,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'latitud' => $this->latitud,
            'longitud' => $this->longitud,
            'status' => (bool) $this->status,
            'empresa_id' => $this->empresa_id,
            'pais_telefono_id' => $this->pais_telefono_id,
            'empresa' => $this->whenLoaded('empresa', fn () => [
                'id' => $this->empresa->id,
                'razon_social' => $this->empresa->razon_social,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
