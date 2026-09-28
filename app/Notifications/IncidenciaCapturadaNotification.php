<?php

namespace App\Notifications;

use App\Models\IncidenciaEmpleado;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Aviso a quienes pueden aprobar de que hay una incidencia esperando.
 *
 * Sin este aviso las pendientes se olvidan: nadie entra a la pantalla de
 * incidencias "por si acaso", la prenómina sale sin ellas y el empleado cobra
 * con faltas que sí tenía justificadas.
 */
class IncidenciaCapturadaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly IncidenciaEmpleado $incidencia,
        private readonly string $empleadoNombre,
        private readonly string $tipoDescripcion,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Incidencia por aprobar',
            'message' => ':tipo de :empleado, del :desde al :hasta (:cantidad). Queda pendiente de aprobación.',
            'params' => [
                'tipo' => $this->tipoDescripcion,
                'empleado' => $this->empleadoNombre,
                'desde' => $this->incidencia->fecha_inicio->format('d/m/Y'),
                'hasta' => $this->incidencia->fecha_fin->format('d/m/Y'),
                'cantidad' => rtrim(rtrim((string) $this->incidencia->cantidad, '0'), '.'),
            ],
            'incidencia_id' => $this->incidencia->id,
        ];
    }
}
