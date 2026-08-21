<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NuevoUsuarioNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly User $nuevoUsuario,
        private readonly string $creadorNombre,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Nuevo usuario creado',
            'message' => ':creador creó la cuenta de :usuario (:correo).',
            'params' => [
                'creador' => $this->creadorNombre,
                'usuario' => $this->nuevoUsuario->name,
                'correo' => $this->nuevoUsuario->email,
            ],
        ];
    }
}
