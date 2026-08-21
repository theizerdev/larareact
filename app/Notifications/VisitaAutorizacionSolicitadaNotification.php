<?php

namespace App\Notifications;

use App\Models\VisitaAccesoAutorizacion;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class VisitaAutorizacionSolicitadaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly VisitaAccesoAutorizacion $autorizacion,
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
            'title' => 'Autorización solicitada',
            'message' => 'Se solicitó a :responsable autorizar el ingreso de :empleado.',
            'params' => [
                'responsable' => $this->responsableNombre,
                'empleado' => $this->empleadoNombre,
            ],
        ];
    }
}
