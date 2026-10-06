<?php

namespace App\Notifications;

use App\Models\FirmaDocumento;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Aviso interno (campana) cuando un documento enviado a firma con ZapSign se
 * firma o se rechaza. Se envía a los usuarios con `validaciones.view`.
 */
class FirmaDocumentoActualizadaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $firmaId,
        private readonly ?int $operacionId,
        private readonly ?string $firmanteNombre,
        private readonly string $estatus,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->estatus === FirmaDocumento::ESTATUS_FIRMADO ? 'Document signed' : 'Document rejected',
            'message' => ':nombre — :resultado',
            'params' => [
                'nombre' => $this->firmanteNombre ?: '#'.$this->firmaId,
                'resultado' => $this->estatus === FirmaDocumento::ESTATUS_FIRMADO ? __('Signed') : __('Rejected'),
            ],
            'url' => $this->operacionId ? '/admin/validaciones/operaciones/'.$this->operacionId : '/admin/validaciones/documentos',
            'firma_documento_id' => $this->firmaId,
            'estatus' => $this->estatus,
        ];
    }
}
