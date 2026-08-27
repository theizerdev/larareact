<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmpresaResource extends JsonResource
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
            'documento' => $this->documento,
            'email' => $this->email,
            'telefono' => $this->telefono,
            'direccion' => $this->direccion,
            'representante_legal' => $this->representante_legal,
            'status' => (bool) $this->status,
            'logo' => $this->logo,
            'logo_mini' => $this->logo_mini,
            'logo_ticket_size' => (int) ($this->logo_ticket_size ?? 200),
            'subscription_status' => $this->subscription_status,
            'pais' => $this->whenLoaded('pais', fn () => [
                'id' => $this->pais->id,
                'nombre' => $this->pais->nombre,
                'codigo_iso2' => $this->pais->codigo_iso2,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
