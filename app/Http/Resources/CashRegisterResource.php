<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashRegisterResource extends JsonResource
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
            'status' => $this->status,
            'opening_amount' => (float) $this->opening_amount,
            'closing_amount' => (float) $this->closing_amount,
            'counted_amount' => (float) $this->counted_amount,
            'difference' => (float) $this->difference,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'empresa_id' => $this->empresa_id,
            'sucursal_id' => $this->sucursal_id,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ]),
            'movements_count' => $this->movements_count ?? 0,
        ];
    }
}
