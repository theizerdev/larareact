<?php

namespace App\Notifications;

use App\Models\KycValidacion;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Aviso interno (campana) cuando termina una validación de identidad (KYC) de
 * una persona en proceso de registro. Se envía a los usuarios de la empresa con
 * permiso `validaciones.view`.
 */
class KycValidacionCompletadaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $validacionId,
        private readonly string $personaNombre,
        private readonly string $personaTipo,
        private readonly string $estatus,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $estatusTxt = match ($this->estatus) {
            KycValidacion::ESTATUS_APROBADO => __('Approved'),
            KycValidacion::ESTATUS_RECHAZADO => __('Rejected'),
            KycValidacion::ESTATUS_REVISION => __('Under review'),
            KycValidacion::ESTATUS_ERROR => __('Error'),
            default => $this->estatus,
        };

        return [
            'title' => 'Identity validation ready',
            'message' => ':nombre (:tipo) — :resultado',
            'params' => [
                'nombre' => $this->personaNombre,
                'tipo' => $this->personaTipo,
                'resultado' => $estatusTxt,
            ],
            'url' => '/admin/validaciones',
            'kyc_validacion_id' => $this->validacionId,
            'estatus' => $this->estatus,
        ];
    }
}
