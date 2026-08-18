<?php

namespace Database\Seeders;

use App\Models\PlantillaPreconsulta;
use App\Models\Especialidad;
use App\Models\Empresa;
use Illuminate\Database\Seeder;

class PlantillaPreconsultaSeeder extends Seeder
{
    public function run(): void
    {
        $empresa = Empresa::first();
        if (!$empresa) return;

        // Limpiar para re-sembrar plantillas de preconsulta sin duplicar
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        PlantillaPreconsulta::truncate();
        \Illuminate\Support\Facades\DB::statement('SET FOREIGN_KEY_CHECKS=1;');


        // 1. Plantilla General / Fallback Global
        PlantillaPreconsulta::create([
            'empresa_id' => $empresa->id,
            'titulo' => 'Cuestionario de Pre-Consulta General',
            'descripcion' => 'Por favor responde estas breves preguntas mientras aguardas en la sala de espera.',
            'is_active' => true,
            'preguntas' => [
                [
                    'id' => 'p1',
                    'label' => '¿Cuál es el motivo principal de su consulta hoy?',
                    'tipo' => 'texto',
                    'obligatorio' => true,
                ],
                [
                    'id' => 'p2',
                    'label' => '¿Ha tenido fiebre o escalofríos en las últimas 48 horas?',
                    'tipo' => 'si_no',
                    'obligatorio' => true,
                    'alerta_si' => 'Paciente presenta fiebre o síntoma febril reciente.',
                ],
                [
                    'id' => 'p3',
                    'label' => '¿Es alérgico a algún medicamento (ej. Penicilina, Ibuprofeno)?',
                    'tipo' => 'texto',
                    'obligatorio' => true,
                    'alerta_si' => 'REVISAR ALERGIAS MEDICAMENTOSAS.',
                ],
                [
                    'id' => 'p4',
                    'label' => 'Nivel de malestar o dolor general (1-10)',
                    'tipo' => 'escala_1_10',
                    'obligatorio' => false,
                ],
            ],
        ]);

        // Mapa de cuestionarios dinámicos según el nombre/slug de la especialidad
        $cuestionariosPorEspecialidad = [
            'Medicina General' => [
                'titulo' => 'Pre-Consulta - Medicina General',
                'descripcion' => 'Triaje y síntomas generales para atención primaria.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Cuál es el motivo principal de su consulta?', 'tipo' => 'texto', 'obligatorio' => true],
                    ['id' => 'p2', 'label' => '¿Ha tenido fiebre en las últimas 48 horas?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Fiebre reportada.'],
                    ['id' => 'p3', 'label' => '¿Medicamentos o alergias conocidas?', 'tipo' => 'texto', 'obligatorio' => true],
                    ['id' => 'p4', 'label' => 'Intensidad del malestar (1 al 10)', 'tipo' => 'escala_1_10', 'obligatorio' => false],
                ],
            ],
            'Ginecología y Obstetricia' => [
                'titulo' => 'Pre-Consulta - Ginecología & Obstetricia',
                'descripcion' => 'Evaluación previa de salud reproductiva y control prenatal.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Fecha de su última menstruación (FUM)?', 'tipo' => 'texto', 'obligatorio' => true],
                    ['id' => 'p2', 'label' => '¿Está embarazada o sospecha estarlo?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => '¿Presenta dolor pélvico o sangrado inusual?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'ALERTA: Sangrado o dolor pélvico agudo.'],
                    ['id' => 'p4', 'label' => 'Motivo principal o molestias actuales', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
            'Pediatría' => [
                'titulo' => 'Pre-Consulta - Pediatría',
                'descripcion' => 'Cuestionario inicial para el tutor/padre del paciente pediátrico.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿El niño/niña presenta fiebre, tos o diarrea?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Síntomas agudos en paciente pediátrico.'],
                    ['id' => 'p2', 'label' => '¿Cuenta con el esquema de vacunas al día?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => 'Alergias a alimentos o medicamentos:', 'tipo' => 'texto', 'obligatorio' => false],
                    ['id' => 'p4', 'label' => 'Describa el motivo de la consulta:', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
            'Cardiología' => [
                'titulo' => 'Pre-Consulta - Cardiología',
                'descripcion' => 'Triage cardiovascular previo a la consulta.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Ha sentido opresión, dolor de pecho o palpitaciones?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => '¡ALERTA CARDIACA! Oprensión o dolor de pecho.'],
                    ['id' => 'p2', 'label' => '¿Es hipertenso o toma medicamentos para la presión?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => 'Indique sus medicamentos diarios:', 'tipo' => 'texto', 'obligatorio' => false],
                    ['id' => 'p4', 'label' => 'Nivel de fatiga o dolor (1 al 10)', 'tipo' => 'escala_1_10', 'obligatorio' => false],
                ],
            ],
            'Cirugía General' => [
                'titulo' => 'Pre-Consulta - Cirugía General',
                'descripcion' => 'Evaluación previa para consulta quirúrgica.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Ha tenido cirugías previas o anestesia general?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p2', 'label' => '¿Es alérgico a la anestesia, látex o antibióticos?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Alergia a anestesia o látex.'],
                    ['id' => 'p3', 'label' => 'Describa el dolor o zona afectada:', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
            'Gastroenterología' => [
                'titulo' => 'Pre-Consulta - Gastroenterología',
                'descripcion' => 'Evaluación de síntomas digestivos e intestinales.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Sufre de acidez, reflujo o gastritis frecuente?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p2', 'label' => '¿Ha tenido vómitos, sangrado u oscurecimiento de heces?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'ALERTA GASTROINTESTINAL.'],
                    ['id' => 'p3', 'label' => 'Detalle sus síntomas principales:', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
            'Otorrinolaringología' => [
                'titulo' => 'Pre-Consulta - Otorrinolaringología (ORL)',
                'descripcion' => 'Evaluación de oído, nariz y garganta.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Presenta dolor de oído, zumbidos o pérdida auditiva?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p2', 'label' => '¿Tiene congestión nasal, mareos o dolor de garganta?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => '¿Cuánto tiempo lleva con estos síntomas?', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
            'Neurología' => [
                'titulo' => 'Pre-Consulta - Neurología',
                'descripcion' => 'Evaluación de migrañas, mareos o sistema nervioso.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Ha tenido dolores de cabeza intensos o adormecimiento?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Cefalea intensa o adormecimiento neurológico.'],
                    ['id' => 'p2', 'label' => '¿Ha presentado convulsiones, pérdidas de memoria o mareos?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => 'Intensidad del dolor de cabeza (1 al 10)', 'tipo' => 'escala_1_10', 'obligatorio' => false],
                ],
            ],
            'Odontología General (Humana)' => [
                'titulo' => 'Pre-Consulta - Odontología Dental',
                'descripcion' => 'Cuestionario de salud oral y molestias dentales.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Tiene dolor agudo en alguna pieza dental o muela?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Dolor dental agudo.'],
                    ['id' => 'p2', 'label' => '¿Siente sensibilidad al frío, caliente o al masticar?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => '¿Cuándo fue su última limpieza dental profesional?', 'tipo' => 'texto', 'obligatorio' => false],
                    ['id' => 'p4', 'label' => 'Nivel de dolor dental (1 al 10)', 'tipo' => 'escala_1_10', 'obligatorio' => false],
                ],
            ],
            'Oftalmología General' => [
                'titulo' => 'Pre-Consulta - Oftalmología',
                'descripcion' => 'Evaluación de visión y molestias oculares.',
                'preguntas' => [
                    ['id' => 'p1', 'label' => '¿Siente visión borrosa, dolor u ojo rojo?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Ojo rojo o dolor ocular activo.'],
                    ['id' => 'p2', 'label' => '¿Utiliza gafas o lentes de contacto actualmente?', 'tipo' => 'si_no', 'obligatorio' => true],
                    ['id' => 'p3', 'label' => 'Describa sus dificultades de visión:', 'tipo' => 'texto', 'obligatorio' => true],
                ],
            ],
        ];

        // Obtener todas las especialidades activas de la BD
        $especialidades = Especialidad::all();

        foreach ($especialidades as $esp) {
            // Buscar si tenemos plantilla personalizada para esta especialidad
            $config = null;
            foreach ($cuestionariosPorEspecialidad as $nombreMatch => $cuestionario) {
                if (mb_strpos(mb_strtolower($esp->nombre), mb_strtolower($nombreMatch)) !== false) {
                    $config = $cuestionario;
                    break;
                }
            }

            if ($config) {
                PlantillaPreconsulta::create([
                    'empresa_id' => $empresa->id,
                    'especialidad_id' => $esp->id,
                    'titulo' => $config['titulo'],
                    'descripcion' => $config['descripcion'],
                    'preguntas' => $config['preguntas'],
                    'is_active' => true,
                ]);
            } else {
                // Plantilla genérica personalizada por especialidad
                PlantillaPreconsulta::create([
                    'empresa_id' => $empresa->id,
                    'especialidad_id' => $esp->id,
                    'titulo' => "Pre-Consulta - {$esp->nombre}",
                    'descripcion' => "Cuestionario de triaje para la especialidad de {$esp->nombre}.",
                    'preguntas' => [
                        ['id' => 'p1', 'label' => "Motivo principal de su consulta en {$esp->nombre}:", 'tipo' => 'texto', 'obligatorio' => true],
                        ['id' => 'p2', 'label' => '¿Tiene alergias a medicamentos o tratamientos activos?', 'tipo' => 'si_no', 'obligatorio' => true, 'alerta_si' => 'Alergia o tratamiento especial.'],
                        ['id' => 'p3', 'label' => 'Intensidad de molestias (1 al 10)', 'tipo' => 'escala_1_10', 'obligatorio' => false],
                    ],
                    'is_active' => true,
                ]);
            }
        }
    }
}
