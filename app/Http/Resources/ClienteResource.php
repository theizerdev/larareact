<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
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
            'email' => $this->email,
            'direccion' => $this->direccion,
            'limite_credito' => (float) $this->limite_credito,
            'saldo_pendiente' => (float) $this->saldo_pendiente,
            'credito_disponible' => max(0, (float) $this->limite_credito - (float) $this->saldo_pendiente),
            'estado' => (bool) $this->estado,
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
