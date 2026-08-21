<?php

namespace App\Notifications;

use App\Models\VisitaAcceso;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VisitaAccesoRegistradaNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly VisitaAcceso $acceso)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Nuevo acceso registrado',
            'message' => ':nombre ingresó a las instalaciones (Código :codigo).',
            'params' => [
                'nombre' => $this->nombreVisitante(),
                'codigo' => $this->acceso->codigo_visitante,
            ],
        ];
    }

    private function nombreVisitante(): string
    {
        return match ($this->acceso->tipo_acceso) {
            'empleado' => trim(($this->acceso->empleado?->nombres ?? '').' '.($this->acceso->empleado?->apellidos ?? '')) ?: 'Un empleado',
            'proveedor' => $this->acceso->proveedor?->razon_social ?: 'Un proveedor',
            'productor' => $this->acceso->productor?->razon_social ?: 'Un productor',
            default => 'Un visitante',
        };
    }
}
