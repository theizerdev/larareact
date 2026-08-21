<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VisitaAutorizacionRespondidaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly bool $autorizado,
        private readonly string $responsableNombre,
        private readonly string $empleadoNombre,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->autorizado ? 'Acceso autorizado' : 'Acceso rechazado',
            'message' => $this->autorizado
                ? ':responsable autorizó el ingreso de :empleado.'
                : ':responsable rechazó el ingreso de :empleado.',
            'params' => [
                'responsable' => $this->responsableNombre,
                'empleado' => $this->empleadoNombre,
            ],
        ];
    }
}
