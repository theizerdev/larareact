<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'status' => $this->status,
            'sueldo_base' => $this->sueldo_base,
            'telefono' => $this->telefono,
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'pais_telefono_id' => $this->pais_telefono_id,
            'empresa' => $this->whenLoaded('empresa', fn () => [
                'id' => $this->empresa->id,
                'razon_social' => $this->empresa->razon_social,
            ]),
            'sucursal' => $this->whenLoaded('sucursal', fn () => [
                'id' => $this->sucursal->id,
                'nombre' => $this->sucursal->nombre,
            ]),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
