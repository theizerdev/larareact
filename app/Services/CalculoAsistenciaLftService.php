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

        // Límite de Horas Extras Dobles según Reforma y Configuración (por defecto 12h en 2026, 9h en 2027+)
        $limiteTexDoble = (float) ($config?->limite_tex_doble_semanal ?? 12.00);

        // Aplicación de la REGLA LFT Dobles vs Triples según cronograma
        $totalHorasExtraDobles = min($limiteTexDoble, $totalHorasExtraBrutas);
        $totalHorasExtraTriples = max(0.00, $totalHorasExtraBrutas - $limiteTexDoble);

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
     * Calcula en tiempo real las horas acumuladas de la semana y evalúa los 3 Semáforos LFT:
     * 1. Semáforo Normal (42h RH | 44h Responsable | 46h DG)
     * 2. Semáforo TEX Doble (7h | 8h | 9h)
     * 3. Semáforo TEX Triple (2h | 3h | 4h)
     */
    public function calcularSemaforosSemanales(
        Empleado $empleado, 
        string $fechaReferencia, 
        ?ConfiguracionAsistencia $config = null,
        $marcajesSemana = null
    ): array {
        $fecha = Carbon::parse($fechaReferencia);
        $inicioSemana = (clone $fecha)->startOfWeek(); // Lunes 00:00:00
        $finSemana = (clone $fecha)->endOfWeek();       // Domingo 23:59:59

        if (!$config) {
            $config = ConfiguracionAsistencia::where('empresa_id', $empleado->empresa_id)->first();
        }

        $anoReforma = (int) ($config?->reforma_laboral_ano ?? 2026);
        $limiteNormales = (float) ($config?->limite_horas_normales_semanal ?? 48.00);
        $limiteTexDoble = (float) ($config?->limite_tex_doble_semanal ?? 12.00);
        $limiteTexTriple = (float) ($config?->limite_tex_triple_semanal ?? 4.00);
        $limiteTotal = $limiteNormales + $limiteTexDoble + $limiteTexTriple;

        // Umbrales Semáforos
        $semNormVerde = (float) ($config?->semaforo_normal_verde ?? 42.00);
        $semNormAmarillo = (float) ($config?->semaforo_normal_amarillo ?? 44.00);
        $semNormRojo = (float) ($config?->semaforo_normal_rojo ?? 46.00);

        $semDobleVerde = (float) ($config?->semaforo_tex_doble_verde ?? 7.00);
        $semDobleAmarillo = (float) ($config?->semaforo_tex_doble_amarillo ?? 8.00);
        $semDobleRojo = (float) ($config?->semaforo_tex_doble_rojo ?? 9.00);

        $semTripleVerde = (float) ($config?->semaforo_tex_triple_verde ?? 2.00);
        $semTripleAmarillo = (float) ($config?->semaforo_tex_triple_amarillo ?? 3.00);
        $semTripleRojo = (float) ($config?->semaforo_tex_triple_rojo ?? 4.00);

        $turno = $empleado->turnoLaboral;
        $horasLey = $turno?->horas_diarias_ley ? (float) $turno->horas_diarias_ley : 8.00;
        $descansoEsTiempoEfectivo = $config?->descanso_es_tiempo_efectivo ?? false;

        // Cargar marcajes de la semana si no fueron pasados pre-cargados
        if ($marcajesSemana === null) {
            $marcajesSemana = AsistenciaMarcaje::where('empleado_id', $empleado->id)
                ->whereBetween('fecha_hora', [$inicioSemana->copy()->startOfDay(), $finSemana->copy()->endOfDay()])
                ->orderBy('fecha_hora', 'asc')
                ->get();
        }

        // Agrupar por día
        $marcajesPorDia = $marcajesSemana->groupBy(function ($m) {
            return Carbon::parse($m->fecha_hora)->toDateString();
        });

        $totalHorasNormales = 0.00;
        $totalHorasExtraBrutas = 0.00;

        foreach ($marcajesPorDia as $diaStr => $marcajesDia) {
            $entrada = $marcajesDia->firstWhere('tipo_marcaje', 'entrada') 
                    ?? $marcajesDia->firstWhere('tipo_marcaje', 'entrada_extraordinaria');
            $salida = $marcajesDia->where('tipo_marcaje', 'salida')->last();

            if ($entrada && $salida) {
                $minutos = Carbon::parse($salida->fecha_hora)->diffInMinutes(Carbon::parse($entrada->fecha_hora));
                $horas = $minutos / 60.0;

                // Descontar almuerzo si no es tiempo efectivo
                if (!$descansoEsTiempoEfectivo) {
                    $salidaComida = $marcajesDia->firstWhere('tipo_marcaje', 'salida_comida');
                    $entradaComida = $marcajesDia->firstWhere('tipo_marcaje', 'entrada_comida');
                    if ($salidaComida && $entradaComida) {
                        $minComida = Carbon::parse($entradaComida->fecha_hora)->diffInMinutes(Carbon::parse($salidaComida->fecha_hora));
                        $horas = max(0, $horas - ($minComida / 60.0));
                    }
                }

                $ord = min($horas, $horasLey);
                $ext = max(0, $horas - $horasLey);

                $totalHorasNormales += $ord;
                $totalHorasExtraBrutas += $ext;
            }
        }

        // Distribución Dobles vs Triples de la semana
        $totalHorasExtraDobles = min($limiteTexDoble, $totalHorasExtraBrutas);
        $totalHorasExtraTriples = max(0.00, $totalHorasExtraBrutas - $limiteTexDoble);
        $totalHorasSemana = $totalHorasNormales + $totalHorasExtraBrutas;

        // Evaluación Semáforo Normal (Notificaciones escalonadas)
        $estadoNormal = 'normal';
        $notifNormal = null;
        $labelNormal = 'Jornada normal en curso';

        if ($totalHorasNormales >= $semNormRojo) {
            $estadoNormal = 'rojo';
            $notifNormal = 'DG';
            $labelNormal = "Alerta Dirección General ({$totalHorasNormales}h / {$semNormRojo}h)";
        } elseif ($totalHorasNormales >= $semNormAmarillo) {
            $estadoNormal = 'amarillo';
            $notifNormal = 'Responsable';
            $labelNormal = "Alerta Responsable ({$totalHorasNormales}h / {$semNormAmarillo}h)";
        } elseif ($totalHorasNormales >= $semNormVerde) {
            $estadoNormal = 'verde';
            $notifNormal = 'RH';
            $labelNormal = "Alerta RH ({$totalHorasNormales}h / {$semNormVerde}h)";
        }

        // Evaluación Semáforo TEX Doble
        $estadoTexDoble = 'normal';
        $labelTexDoble = 'Sin exceso de horas dobles';
        if ($totalHorasExtraDobles >= $semDobleRojo) {
            $estadoTexDoble = 'rojo';
            $labelTexDoble = "Límite Doble alcanzado ({$totalHorasExtraDobles}h / {$semDobleRojo}h)";
        } elseif ($totalHorasExtraDobles >= $semDobleAmarillo) {
            $estadoTexDoble = 'amarillo';
            $labelTexDoble = "Atención Doble ({$totalHorasExtraDobles}h / {$semDobleAmarillo}h)";
        } elseif ($totalHorasExtraDobles >= $semDobleVerde) {
            $estadoTexDoble = 'verde';
            $labelTexDoble = "Preventivo Doble ({$totalHorasExtraDobles}h / {$semDobleVerde}h)";
        }

        // Evaluación Semáforo TEX Triple
        $estadoTexTriple = 'normal';
        $labelTexTriple = 'Sin horas triples';
        if ($totalHorasExtraTriples >= $semTripleRojo) {
            $estadoTexTriple = 'rojo';
            $labelTexTriple = "Límite Máximo LFT ({$totalHorasExtraTriples}h / {$semTripleRojo}h)";
        } elseif ($totalHorasExtraTriples >= $semTripleAmarillo) {
            $estadoTexTriple = 'amarillo';
            $labelTexTriple = "Alerta Crítica Triple ({$totalHorasExtraTriples}h / {$semTripleAmarillo}h)";
        } elseif ($totalHorasExtraTriples >= $semTripleVerde) {
            $estadoTexTriple = 'verde';
            $labelTexTriple = "Alerta Inicial Triple ({$totalHorasExtraTriples}h / {$semTripleVerde}h)";
        }

        // Alerta consolidada más alta de los 3 semáforos
        $prioridades = ['rojo' => 3, 'amarillo' => 2, 'verde' => 1, 'normal' => 0];
        $maxPrio = max(
            $prioridades[$estadoNormal],
            $prioridades[$estadoTexDoble],
            $prioridades[$estadoTexTriple]
        );
        $alertaConsolidada = array_search($maxPrio, $prioridades);

        $destinatarios = [];
        if ($notifNormal) {
            $destinatarios[] = $notifNormal;
        }

        return [
            'periodo' => [
                'inicio' => $inicioSemana->toDateString(),
                'fin' => $finSemana->toDateString(),
                'ano_reforma' => $anoReforma,
            ],
            'limites' => [
                'normales' => $limiteNormales,
                'tex_doble' => $limiteTexDoble,
                'tex_triple' => $limiteTexTriple,
                'total' => $limiteTotal,
            ],
            'horas' => [
                'normales' => round($totalHorasNormales, 2),
                'tex_doble' => round($totalHorasExtraDobles, 2),
                'tex_triple' => round($totalHorasExtraTriples, 2),
                'extra_brutas' => round($totalHorasExtraBrutas, 2),
                'totales' => round($totalHorasSemana, 2),
            ],
            'semaforos' => [
                'normal' => [
                    'horas' => round($totalHorasNormales, 2),
                    'limite' => $limiteNormales,
                    'estado' => $estadoNormal,
                    'label' => $labelNormal,
                    'notificar_a' => $notifNormal,
                    'umbrales' => ['verde' => $semNormVerde, 'amarillo' => $semNormAmarillo, 'rojo' => $semNormRojo],
                ],
                'tex_doble' => [
                    'horas' => round($totalHorasExtraDobles, 2),
                    'limite' => $limiteTexDoble,
                    'estado' => $estadoTexDoble,
                    'label' => $labelTexDoble,
                    'umbrales' => ['verde' => $semDobleVerde, 'amarillo' => $semDobleAmarillo, 'rojo' => $semDobleRojo],
                ],
                'tex_triple' => [
                    'horas' => round($totalHorasExtraTriples, 2),
                    'limite' => $limiteTexTriple,
                    'estado' => $estadoTexTriple,
                    'label' => $labelTexTriple,
                    'umbrales' => ['verde' => $semTripleVerde, 'amarillo' => $semTripleAmarillo, 'rojo' => $semTripleRojo],
                ],
                'alerta_global' => $alertaConsolidada,
                'destinatarios' => $destinatarios,
            ],
        ];
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
