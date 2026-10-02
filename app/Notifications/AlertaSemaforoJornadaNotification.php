<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AlertaSemaforoJornadaNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $empleadoNombre,
        private readonly string $nivelAlerta, // 'verde', 'amarillo', 'rojo'
        private readonly string $tipoJornada, // 'normal', 'tex_doble', 'tex_triple'
        private readonly float $horasAcumuladas,
        private readonly float $limiteHoras,
        private readonly string $destinatarioEscalonado, // 'RH', 'Responsable', 'DG'
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $tipoLabel = match ($this->tipoJornada) {
            'normal' => 'Jornada Ordinaria',
            'tex_doble' => 'Horas Extras Dobles',
            'tex_triple' => 'Horas Extras Triples',
            default => 'Jornada Laboral',
        };

        $nivelColor = match ($this->nivelAlerta) {
            'verde' => '🟢 Preventivo (RH)',
            'amarillo' => '🟡 Precaución (Responsable)',
            'rojo' => '🔴 Crítico (Dirección General)',
            default => 'Alerta',
        };

        return [
            'title' => "Semáforo LFT: {$nivelColor}",
            'message' => ":empleado ha acumulado :horas h en :tipo (Umbral: :limite h). Notificación escalonada a :destinatario.",
            'params' => [
                'empleado' => $this->empleadoNombre,
                'tipo' => $tipoLabel,
                'horas' => number_format($this->horasAcumuladas, 1),
                'limite' => number_format($this->limiteHoras, 1),
                'nivel' => $this->nivelAlerta,
                'destinatario' => $this->destinatarioEscalonado,
            ],
        ];
    }
}
