<?php

namespace App\Console\Commands;

use App\Models\Cita;
use App\Services\CitaNotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class UpdateCitaEstados extends Command
{
    protected $signature = 'citas:update-estados {--grace=15}';

    protected $description = 'Actualiza estados de citas a en_curso/completada/no_asistio según la hora';

    public function handle()
    {
        $grace = (int) ($this->option('grace') ?? 15);
        $envGrace = (int) env('CITA_GRACE_MINUTES', 0);
        if ($envGrace > 0) {
            $grace = $envGrace;
        }
        $now = Carbon::now();
        $graceEnd = $now->copy()->subMinutes($grace);

        $this->actualizarEnCurso($now);
        $this->actualizarFinalizadas($graceEnd);
        $this->actualizarNoAsistio($graceEnd);

        return Command::SUCCESS;
    }

    protected function actualizarEnCurso(Carbon $now): void
    {
        $citas = Cita::where('fecha_inicio', '<=', $now)
            ->where('fecha_fin', '>', $now)
            ->whereIn('estado', [Cita::ESTADO_CONFIRMADA])
            ->get();

        foreach ($citas as $cita) {
            $estadoAnterior = $cita->estado;
            $cita->cambiarEstado(Cita::ESTADO_EN_CURSO);
            $service = CitaNotificationService::forCompany($cita->empresa_id);
            $service->notificarCambioEstado($cita, $estadoAnterior);
            try {
                activity()
                    ->performedOn($cita)
                    ->withProperties([
                        'previous' => $estadoAnterior,
                        'new' => Cita::ESTADO_EN_CURSO,
                        'source' => 'scheduler',
                    ])
                    ->log('cita_estado_actualizado_automaticamente');
            } catch (\Throwable $e) {
            }
        }
    }

    protected function actualizarFinalizadas(Carbon $graceEnd): void
    {
        $citas = Cita::where('fecha_fin', '<=', $graceEnd)
            ->where('estado', Cita::ESTADO_EN_CURSO)
            ->get();

        foreach ($citas as $cita) {
            $estadoAnterior = $cita->estado;
            $cita->cambiarEstado(Cita::ESTADO_FINALIZADA);
            $service = CitaNotificationService::forCompany($cita->empresa_id);
            $service->notificarCambioEstado($cita, $estadoAnterior);
            try {
                activity()
                    ->performedOn($cita)
                    ->withProperties([
                        'previous' => $estadoAnterior,
                        'new' => Cita::ESTADO_FINALIZADA,
                        'source' => 'scheduler',
                    ])
                    ->log('cita_estado_actualizado_automaticamente');
            } catch (\Throwable $e) {
            }
        }
    }

    protected function actualizarNoAsistio(Carbon $graceEnd): void
    {
        $citas = Cita::where('fecha_fin', '<=', $graceEnd)
            ->whereIn('estado', [Cita::ESTADO_PENDIENTE, Cita::ESTADO_CONFIRMADA])
            ->get();

        foreach ($citas as $cita) {
            $estadoAnterior = $cita->estado;
            $cita->cambiarEstado(Cita::ESTADO_NO_ASISTIO);
            $service = CitaNotificationService::forCompany($cita->empresa_id);
            $service->notificarCambioEstado($cita, $estadoAnterior);
            try {
                activity()
                    ->performedOn($cita)
                    ->withProperties([
                        'previous' => $estadoAnterior,
                        'new' => Cita::ESTADO_NO_ASISTIO,
                        'source' => 'scheduler',
                    ])
                    ->log('cita_estado_actualizado_automaticamente');
            } catch (\Throwable $e) {
            }
        }
    }
}
