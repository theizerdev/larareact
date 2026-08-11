<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\AsistenciaResumenSemanal;
use App\Models\ConfiguracionAsistencia;
use App\Models\DiaFestivo;
use App\Models\Empleado;

use Carbon\Carbon;

class CalculoAsistenciaLftService
{
    /**
     * Procesa y calcula las horas laboradas, retardo, descansos e importes de un empleado en un día.
     */
    public function calcularHorasDiarias(Empleado $empleado, string $fechaDateString): AsistenciaResumenDiario
    {
        $fecha = Carbon::parse($fechaDateString);
        $empresaId = $empleado->empresa_id;

        // Cargar configuración de asistencia y turno del empleado
        $config = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();
        $toleranciaRetardo = $config?->tolerancia_retardo_minutos ?? 10;
        $descansoEsTiempoEfectivo = $config?->descanso_es_tiempo_efectivo ?? false;

        $turno = $empleado->turnoLaboral;
        $horasLey = $turno?->horas_diarias_ley ? (float) $turno->horas_diarias_ley : 8.00;

        // Cargar todos los marcajes del empleado en esa fecha
        $marcajes = AsistenciaMarcaje::where('empleado_id', $empleado->id)
            ->whereDate('fecha_hora', $fecha->toDateString())
            ->orderBy('fecha_hora', 'asc')
            ->get();

        $entrada = $marcajes->firstWhere('tipo_marcaje', 'entrada');
        $salidaComida = $marcajes->firstWhere('tipo_marcaje', 'salida_comida');
        $entradaComida = $marcajes->firstWhere('tipo_marcaje', 'entrada_comida');
        $salida = $marcajes->where('tipo_marcaje', 'salida')->last();

        $horaEntradaReal = $entrada ? $entrada->fecha_hora->format('H:i:s') : null;
        $horaSalidaReal = $salida ? $salida->fecha_hora->format('H:i:s') : null;

        // Cálculo de Minutos de Retardo
        $minutosRetardo = 0;
        if ($entrada && $turno && $turno->hora_entrada) {
            $horaEntradaTeorica = Carbon::parse($fecha->toDateString().' '.$turno->hora_entrada);
            if ($entrada->fecha_hora->gt($horaEntradaTeorica)) {
                $diferencia = $entrada->fecha_hora->diffInMinutes($horaEntradaTeorica);
                if ($diferencia > $toleranciaRetardo) {
                    $minutosRetardo = $diferencia;
                }
            }
        }

        // Cálculo de minutos de descanso consumidos
        $minutosDescansoReales = 0;
        if ($salidaComida && $entradaComida) {
            $minutosDescansoReales = $entradaComida->fecha_hora->diffInMinutes($salidaComida->fecha_hora);
        }

        // Cálculo de horas trabajadas brutas
        $horasTrabajadasBrutas = 0.00;
        if ($entrada && $salida) {
            $minutosTotales = $salida->fecha_hora->diffInMinutes($entrada->fecha_hora);
            $horasTrabajadasBrutas = $minutosTotales / 60.0;
        }

        // Descontar descanso no pagado si aplica (Art. 64 LFT)
        $horasTrabajadasNetas = $horasTrabajadasBrutas;
        if (! $descansoEsTiempoEfectivo && $minutosDescansoReales > 0) {
            $horasTrabajadasNetas = max(0, $horasTrabajadasBrutas - ($minutosDescansoReales / 60.0));
        }

        // Separar Horas Ordinarias y Horas Extra Diarias
        $horasOrdinarias = min($horasTrabajadasNetas, $horasLey);
        $horasExtraDiarias = max(0, $horasTrabajadasNetas - $horasLey);

        // Verificar si es domingo (Prima Dominical Art. 71 LFT)
        $aplicaPrimaDominical = $fecha->isSunday() && $horasTrabajadasNetas > 0;

        // Verificar si es día festivo (Art. 74 LFT)
        $esFestivo = DiaFestivo::where(function ($q) use ($empresaId) {
            $q->where('empresa_id', $empresaId)->orWhereNull('empresa_id');
        })
            ->whereDate('fecha', $fecha->toDateString())
            ->exists();

        // Verificar si es día de descanso semanal
        $diasLaborables = $turno?->dias_laborables ?? [1, 2, 3, 4, 5];
        $esDiaDescanso = ! in_array($fecha->dayOfWeekIso, $diasLaborables);

        // Cálculo del Monto Estimado Diario
        $salarioDiario = $empleado->salario_diario ? (float) $empleado->salario_diario : 0.00;
        $tarifaHoraOrdinaria = $horasLey > 0 ? ($salarioDiario / $horasLey) : 0.00;

        $montoDia = $horasOrdinarias * $tarifaHoraOrdinaria;

        return AsistenciaResumenDiario::updateOrCreate(
            [
                'empleado_id' => $empleado->id,
                'fecha' => $fecha->toDateString(),
            ],
            [
                'empresa_id' => $empresaId,
                'turno_laboral_id' => $turno?->id,
                'hora_entrada_real' => $horaEntradaReal,
                'hora_salida_real' => $horaSalidaReal,
                'minutos_retraso' => $minutosRetardo,
                'minutos_descanso_reales' => $minutosDescansoReales,
                'horas_ordinarias' => round($horasOrdinarias, 2),
                'horas_extra_diarias' => round($horasExtraDiarias, 2),
                'es_festivo' => $esFestivo,
                'aplica_prima_dominical' => $aplicaPrimaDominical,
                'es_dia_descanso' => $esDiaDescanso,
                'estado' => 'aprobado',
                'monto_estimado_dia' => round($montoDia, 2),
            ]
        );
    }

    /**
     * Procesa y genera el resumen semanal de horas extras (Regla 3x3 LFT: Dobles vs Triples) y remuneraciones.
     */
    public function procesarResumenSemanal(Empleado $empleado, string $fechaInicioSemana, string $fechaFinSemana): AsistenciaResumenSemanal
    {
        $inicio = Carbon::parse($fechaInicioSemana);
        $fin = Carbon::parse($fechaFinSemana);
        $empresaId = $empleado->empresa_id;

        $config = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();
        $porcentajePrimaDominical = $config?->porcentaje_prima_dominical ? (float) $config->porcentaje_prima_dominical : 25.00;

        // Cargar resúmenes diarios de la semana
        $resumenesDiarios = AsistenciaResumenDiario::where('empleado_id', $empleado->id)
            ->whereBetween('fecha', [$inicio->toDateString(), $fin->toDateString()])
            ->get();

        $totalHorasOrdinarias = $resumenesDiarios->sum('horas_ordinarias');
        $totalHorasExtraBrutas = $resumenesDiarios->sum('horas_extra_diarias');
        $diasFestivosTrabajados = $resumenesDiarios->where('es_festivo', true)->count();
        $primasDominicalesAplicadas = $resumenesDiarios->where('aplica_prima_dominical', true)->count();

        // Aplicación de la REGLA 3x3 LFT (Arts. 66, 67 y 68)
        // Primeras 9 horas extras semanales = Dobles (+100% / 2x tarifa hora)
        // Excedente de 9 horas extras semanales = Triples (+200% / 3x tarifa hora)
        $totalHorasExtraDobles = min(9.00, $totalHorasExtraBrutas);
        $totalHorasExtraTriples = max(0.00, $totalHorasExtraBrutas - 9.00);

        // Cálculo económico de nómina
        $salarioDiario = $empleado->salario_diario ? (float) $empleado->salario_diario : 0.00;
        $turno = $empleado->turnoLaboral;
        $horasLey = $turno?->horas_diarias_ley ? (float) $turno->horas_diarias_ley : 8.00;
        $tarifaHora = $horasLey > 0 ? ($salarioDiario / $horasLey) : 0.00;

        $montoOrdinario = $totalHorasOrdinarias * $tarifaHora;
        $montoDobles = $totalHorasExtraDobles * ($tarifaHora * 2.00);
        $montoTriples = $totalHorasExtraTriples * ($tarifaHora * 3.00);
        $montoPrimasDominicales = $primasDominicalesAplicadas * ($salarioDiario * ($porcentajePrimaDominical / 100.00));
        $montoFestivos = $diasFestivosTrabajados * ($salarioDiario * 2.00); // 200% adicional

        $montoTotalPagar = $montoOrdinario + $montoDobles + $montoTriples + $montoPrimasDominicales + $montoFestivos;

        return AsistenciaResumenSemanal::updateOrCreate(
            [
                'empleado_id' => $empleado->id,
                'periodo_inicio' => $inicio->toDateString(),
                'periodo_fin' => $fin->toDateString(),
            ],
            [
                'empresa_id' => $empresaId,
                'total_horas_ordinarias' => round($totalHorasOrdinarias, 2),
                'total_horas_extra_dobles' => round($totalHorasExtraDobles, 2),
                'total_horas_extra_triples' => round($totalHorasExtraTriples, 2),
                'dias_festivos_trabajados' => $diasFestivosTrabajados,
                'primas_dominicales_aplicadas' => $primasDominicalesAplicadas,
                'monto_horas_ordinarias' => round($montoOrdinario, 2),
                'monto_horas_dobles' => round($montoDobles, 2),
                'monto_horas_triples' => round($montoTriples, 2),
                'monto_primas_dominicales' => round($montoPrimasDominicales, 2),
                'monto_festivos' => round($montoFestivos, 2),
                'monto_total_pagar' => round($montoTotalPagar, 2),
                'estado' => 'abierto',
            ]
        );
    }

    /**
     * Devuelve la clasificación de semáforo semanal según horas laboradas.
     */
    public function obtenerSemaforoSemanal(float $totalHoras): array
    {
        if ($totalHoras <= 40.0) {
            return [
                'nivel' => 'verde',
                'label' => 'Jornada Normal (1 - 40h)',
                'color_class' => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                'alerta_explotacion' => false,
            ];
        } elseif ($totalHoras <= 48.0) {
            return [
                'nivel' => 'amarillo',
                'label' => 'Horas Extra (41 - 48h)',
                'color_class' => 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                'alerta_explotacion' => false,
            ];
        } elseif ($totalHoras <= 60.0) {
            return [
                'nivel' => 'rojo',
                'label' => 'Exceso de Jornada (49 - 60h)',
                'color_class' => 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                'alerta_explotacion' => false,
            ];
        } else {
            return [
                'nivel' => 'critico',
                'label' => '¡Explotación Laboral! (>61h)',
                'color_class' => 'bg-rose-950 text-white border-rose-600 animate-pulse font-black',
                'alerta_explotacion' => true,
            ];
        }
    }
}
