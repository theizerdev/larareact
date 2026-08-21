<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DescansoExcedidoNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $empleadoNombre,
        private readonly string $concepto,
        private readonly int $minutosExcedidos,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Descanso excedido',
            'message' => ':empleado excedió su :concepto por :minutos min.',
            'params' => [
                'empleado' => $this->empleadoNombre,
                'concepto' => $this->concepto,
                'minutos' => (string) $this->minutosExcedidos,
            ],
        ];
    }
}
