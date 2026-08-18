<?php

namespace Database\Seeders;

use App\Models\Cita;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\MedicoHorario;
use App\Models\Paciente;
use App\Models\TipoAtencion;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class CitaSeeder extends Seeder
{
    public function run(): void
    {
        $medicos = Medico::all();
        $pacientes = Paciente::all();
        $tiposAtencion = TipoAtencion::all();
        $especialidades = Especialidad::all();

        if ($medicos->isEmpty() || $pacientes->isEmpty()) {
            return;
        }

        $medicoDefault = $medicos->first();
        $empresaId = $medicoDefault->empresa_id;

        // 1. Configurar horarios predeterminados para los médicos (Lunes a Viernes de 8:00 a 17:00 con almuerzo 13:00 - 14:00)
        foreach ($medicos as $medico) {
            for ($dia = 1; $dia <= 5; $dia++) {
                MedicoHorario::updateOrCreate(
                    ['medico_id' => $medico->id, 'dia_semana' => $dia],
                    [
                        'empresa_id' => $medico->empresa_id,
                        'hora_inicio' => '08:00:00',
                        'hora_fin' => '17:00:00',
                        'hora_inicio_almuerzo' => '13:00:00',
                        'hora_fin_almuerzo' => '14:00:00',
                        'buffer_minutos' => 10,
                        'activo' => true,
                    ]
                );
            }
        }

        // 2. Crear citas de demostración para hoy y días próximos con distintos estados y colores
        $hoy = Carbon::today();

        $citasDemo = [
            [
                'fecha_hora_inicio' => $hoy->copy()->setHour(9)->setMinute(0),
                'duracion' => 30,
                'estado' => 'confirmada_pagada',
                'motivo' => 'Consulta de control de presión arterial y ajuste de medicación.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->setHour(10)->setMinute(0),
                'duracion' => 30,
                'estado' => 'en_sala_espera',
                'motivo' => 'Revisión por síntomas gripales leves y tos persistente.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->setHour(11)->setMinute(0),
                'duracion' => 45,
                'estado' => 'en_consulta',
                'motivo' => 'Evaluación de exámenes de laboratorio de rutina.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->setHour(14)->setMinute(30),
                'duracion' => 30,
                'estado' => 'pendiente',
                'motivo' => 'Primera consulta médica por dolor en articulación de la rodilla.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->setHour(16)->setMinute(0),
                'duracion' => 30,
                'estado' => 'atendida',
                'motivo' => 'Chequeo pediátrico / vacunación de seguimiento.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->addDay()->setHour(9)->setMinute(30),
                'duracion' => 30,
                'estado' => 'confirmada_pagada',
                'motivo' => 'Seguimiento post-operatorio.',
            ],
            [
                'fecha_hora_inicio' => $hoy->copy()->addDay()->setHour(11)->setMinute(30),
                'duracion' => 30,
                'estado' => 'pendiente',
                'motivo' => 'Consulta odontológica preventiva.',
            ],
        ];

        foreach ($citasDemo as $i => $data) {
            $paciente = $pacientes[$i % $pacientes->count()];
            $medico = $medicos[$i % $medicos->count()];
            $tipo = $tiposAtencion[$i % $tiposAtencion->count()] ?? null;
            $especialidad = $especialidades->firstWhere('id', $medico->especialidad_principal_id) ?? $especialidades->first();

            $inicio = $data['fecha_hora_inicio'];
            $fin = $inicio->copy()->addMinutes($data['duracion']);

            Cita::create([
                'empresa_id' => $medico->empresa_id,
                'sucursal_id' => $medico->sucursal_id,
                'paciente_id' => $paciente->id,
                'medico_id' => $medico->id,
                'especialidad_id' => $especialidad->id ?? null,
                'tipo_atencion_id' => $tipo->id ?? null,
                'fecha_hora_inicio' => $inicio,
                'fecha_hora_fin' => $fin,
                'duracion_minutos' => $data['duracion'],
                'buffer_descanso_minutos' => 10,
                'estado' => $data['estado'],
                'motivo_consulta' => $data['motivo'],
                'notas_recepcion' => 'Paciente puntual en recepción.',
                'link_virtual' => $tipo && $tipo->requiere_link_virtual ? 'https://meet.jit.si/sismed-demo-' . $i : null,
                'monto_estimado' => $tipo->costo_adicional_sugerido ?? 50.00,
                'monto_pagado' => $data['estado'] === 'confirmada_pagada' ? ($tipo->costo_adicional_sugerido ?? 50.00) : 0.00,
                'estado_pago' => $data['estado'] === 'confirmada_pagada' ? 'pagado' : 'pendiente',
                'fecha_llegada_sala_espera' => in_array($data['estado'], ['en_sala_espera', 'en_consulta', 'atendida']) ? $inicio->copy()->subMinutes(15) : null,
                'fecha_inicio_consulta' => in_array($data['estado'], ['en_consulta', 'atendida']) ? $inicio : null,
                'fecha_fin_consulta' => $data['estado'] === 'atendida' ? $fin : null,
            ]);
        }
    }
}
