<?php

namespace Database\Seeders;

use App\Models\Especialidad;
use App\Models\PlantillaConsulta;
use App\Models\RamaMedica;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EspecialidadesSeeder extends Seeder
{
    public function run(): void
    {
        $ramas = [
            [
                'nombre' => 'Medicina Humana',
                'slug' => 'medicina-humana',
                'icono' => 'Stethoscope',
                'descripcion' => 'Consultas de medicina humana general, especialidades médicas y quirúrgicas.',
                'especialidades' => [
                    [
                        'nombre' => 'Medicina General',
                        'codigo' => 'MED-GEN',
                        'icono' => 'Stethoscope',
                        'color' => '#10b981',
                        'costo' => 30.00,
                        'duracion' => 20,
                        'descripcion' => 'Atención médica primaria y chequeos generales.',
                        'plantilla' => [
                            ['id' => 'motivo_consulta', 'label' => 'Motivo de Consulta', 'type' => 'textarea', 'required' => true],
                            ['id' => 'enfermedad_actual', 'label' => 'Enfermedad Actual', 'type' => 'textarea', 'required' => true],
                            ['id' => 'signos_vitales', 'label' => 'Signos Vitales', 'type' => 'grid', 'fields' => [
                                ['id' => 'presion_arterial', 'label' => 'Presión Arterial (mmHg)', 'type' => 'text'],
                                ['id' => 'frecuencia_cardiaca', 'label' => 'Frecuencia Cardíaca (bpm)', 'type' => 'number'],
                                ['id' => 'temperatura', 'label' => 'Temperatura (°C)', 'type' => 'number'],
                                ['id' => 'peso', 'label' => 'Peso (kg)', 'type' => 'number'],
                                ['id' => 'estatura', 'label' => 'Estatura (cm)', 'type' => 'number'],
                                ['id' => 'saturacion_oxigeno', 'label' => 'SpO2 (%)', 'type' => 'number'],
                            ]],
                            ['id' => 'examen_fisico', 'label' => 'Examen Físico', 'type' => 'textarea'],
                            ['id' => 'diagnostico_cie10', 'label' => 'Diagnóstico (CIE-10)', 'type' => 'text'],
                            ['id' => 'plan_tratamiento', 'label' => 'Plan de Tratamiento y Receta', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Ginecología y Obstetricia',
                        'codigo' => 'GIN-OBS',
                        'icono' => 'Venus',
                        'color' => '#ec4899',
                        'costo' => 50.00,
                        'duracion' => 30,
                        'descripcion' => 'Salud reproductiva femenina, control prenatal y ginecológico.',
                        'plantilla' => [
                            ['id' => 'fum', 'label' => 'Fecha de Última Menstruación (FUM)', 'type' => 'date'],
                            ['id' => 'gestas_partos', 'label' => 'Historial Obstétrico (G / P / C / A)', 'type' => 'text'],
                            ['id' => 'semanas_gestacion', 'label' => 'Semanas de Gestación', 'type' => 'number'],
                            ['id' => 'ecografia_prenatal', 'label' => 'Hallazgos Ecográficos', 'type' => 'textarea'],
                            ['id' => 'examen_ginecologico', 'label' => 'Examen Ginecológico / Citología', 'type' => 'textarea'],
                            ['id' => 'diagnostico', 'label' => 'Diagnóstico', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Pediatría',
                        'codigo' => 'PED',
                        'icono' => 'Baby',
                        'color' => '#06b6d4',
                        'costo' => 40.00,
                        'duracion' => 30,
                        'descripcion' => 'Atención médica de lactantes, niños y adolescentes.',
                        'plantilla' => [
                            ['id' => 'peso_talla_percentil', 'label' => 'Peso, Talla y Perímetro Cefálico (Percentiles)', 'type' => 'grid', 'fields' => [
                                ['id' => 'peso_kg', 'label' => 'Peso (kg)', 'type' => 'number'],
                                ['id' => 'talla_cm', 'label' => 'Talla (cm)', 'type' => 'number'],
                                ['id' => 'perimetro_cefalico', 'label' => 'Perímetro Cefálico (cm)', 'type' => 'number'],
                            ]],
                            ['id' => 'esquema_vacunacion', 'label' => 'Estado del Esquema de Vacunación', 'type' => 'select', 'options' => ['Al Día', 'Incompleto', 'Pendiente Dosis']],
                            ['id' => 'desarrollo_psicomotor', 'label' => 'Desarrollo Psicomotor y Hitos', 'type' => 'textarea'],
                            ['id' => 'alimentacion', 'label' => 'Alimentación (Lactancia / Ablactación)', 'type' => 'textarea'],
                            ['id' => 'diagnostico_pediatrico', 'label' => 'Diagnóstico y Recomendaciones', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Cardiología',
                        'codigo' => 'CARDIO',
                        'icono' => 'HeartPulse',
                        'color' => '#ef4444',
                        'costo' => 60.00,
                        'duracion' => 30,
                        'descripcion' => 'Diagnóstico y tratamiento de enfermedades cardiovasculares.',
                        'plantilla' => [
                            ['id' => 'hallazgos_ekg', 'label' => 'Hallazgos del Electrocardiograma (EKG)', 'type' => 'textarea'],
                            ['id' => 'ecocardiograma', 'label' => 'Ecocardiograma / Prueba de Esfuerzo', 'type' => 'textarea'],
                            ['id' => 'riesgo_cardiovascular', 'label' => 'Estratificación de Riesgo Cardiovascular', 'type' => 'select', 'options' => ['Bajo', 'Moderado', 'Alto', 'Muy Alto']],
                            ['id' => 'tratamiento_antihipertensivo', 'label' => 'Esquema de Medicación Cardiovascular', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Cirugía General',
                        'codigo' => 'CIR-GEN',
                        'icono' => 'Scissors',
                        'color' => '#8b5cf6',
                        'costo' => 65.00,
                        'duracion' => 35,
                        'descripcion' => 'Evaluación pre/post operatoria y procedimientos quirúrgicos generales.',
                        'plantilla' => [
                            ['id' => 'diagnostico_quirurgico', 'label' => 'Diagnóstico Quirúrgico', 'type' => 'text'],
                            ['id' => 'evaluacion_preoperatoria', 'label' => 'Riesgo Quirúrgico / Anestésico (ASA)', 'type' => 'select', 'options' => ['ASA I', 'ASA II', 'ASA III', 'ASA IV', 'ASA V']],
                            ['id' => 'plan_quirurgico', 'label' => 'Procedimiento Propuesto / Técnica', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Cirugía Pediátrica',
                        'codigo' => 'CIR-PED',
                        'icono' => 'Scissors',
                        'color' => '#a855f7',
                        'costo' => 70.00,
                        'duracion' => 35,
                        'descripcion' => 'Procedimientos quirúrgicos en pacientes pediátricos.',
                        'plantilla' => [
                            ['id' => 'evaluacion_pediatrica_quirurgica', 'label' => 'Evaluación Preoperatoria Pediátrica', 'type' => 'textarea'],
                            ['id' => 'indicacion_quirurgica', 'label' => 'Indicación y Plan de Cirugía', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Gastroenterología',
                        'codigo' => 'GASTRO',
                        'icono' => 'UtensilsCrossed',
                        'color' => '#f97316',
                        'costo' => 55.00,
                        'duracion' => 30,
                        'descripcion' => 'Diagnóstico y tratamiento del sistema digestivo.',
                        'plantilla' => [
                            ['id' => 'sintomas_digestivos', 'label' => 'Síntomas Digestivos (Dispepsia, Reflujo, Hábito Intestinal)', 'type' => 'textarea'],
                            ['id' => 'endoscopia_colonoscopia', 'label' => 'Estudios Endoscópicos / Imagen', 'type' => 'textarea'],
                            ['id' => 'plan_gastro', 'label' => 'Plan Terapéutico y Dieta', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Mastología',
                        'codigo' => 'MASTO',
                        'icono' => 'Ribbon',
                        'color' => '#f43f5e',
                        'costo' => 60.00,
                        'duracion' => 30,
                        'descripcion' => 'Prevención, diagnóstico y tratamiento de patologías mamarias.',
                        'plantilla' => [
                            ['id' => 'examen_mamario', 'label' => 'Examen Físico de Mamas y Axilas', 'type' => 'textarea'],
                            ['id' => 'mamografia_birads', 'label' => 'Mamografía / Eco Mamario (Categoría BI-RADS)', 'type' => 'select', 'options' => ['BI-RADS 0', 'BI-RADS 1', 'BI-RADS 2', 'BI-RADS 3', 'BI-RADS 4', 'BI-RADS 5']],
                            ['id' => 'conducta_mastologia', 'label' => 'Conducta y Plan Clínico', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Medicina Interna',
                        'codigo' => 'MED-INT',
                        'icono' => 'UserCheck',
                        'color' => '#3b82f6',
                        'costo' => 50.00,
                        'duracion' => 30,
                        'descripcion' => 'Atención integral y diagnóstico de patologías complejas del adulto.',
                        'plantilla' => [
                            ['id' => 'revision_sistemas', 'label' => 'Revisión por Sistemas', 'type' => 'textarea'],
                            ['id' => 'enfermedades_cronicas', 'label' => 'Control de Enfermedades Crónicas (HTA, Diabetes, Dislipidemia)', 'type' => 'textarea'],
                            ['id' => 'plan_interdisciplinario', 'label' => 'Plan Diagnóstico y Tratamiento', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Nefrología',
                        'codigo' => 'NEFRO',
                        'icono' => 'Activity',
                        'color' => '#14b8a6',
                        'costo' => 60.00,
                        'duracion' => 30,
                        'descripcion' => 'Diagnóstico y tratamiento de la función renal y diálisis.',
                        'plantilla' => [
                            ['id' => 'tasa_filtracion_gfr', 'label' => 'Tasa de Filtración Glomerular (eGFR / Creatinina)', 'type' => 'text'],
                            ['id' => 'examen_orina', 'label' => 'Uroanálisis / Proteinuria', 'type' => 'textarea'],
                            ['id' => 'estadio_ckd', 'label' => 'Estadio de Enfermedad Renal Crónica', 'type' => 'select', 'options' => ['Sin ERC', 'Estadio 1', 'Estadio 2', 'Estadio 3a', 'Estadio 3b', 'Estadio 4', 'Estadio 5']],
                        ],
                    ],
                    [
                        'nombre' => 'Otorrinolaringología',
                        'codigo' => 'ORL',
                        'icono' => 'Ear',
                        'color' => '#78350f',
                        'costo' => 50.00,
                        'duracion' => 25,
                        'descripcion' => 'Evaluación y tratamiento de oídos, nariz, garganta y cabeza/cuello.',
                        'plantilla' => [
                            ['id' => 'otoscopia', 'label' => 'Otoscopia (Oído Derecho / Oído Izquierdo)', 'type' => 'textarea'],
                            ['id' => 'rinoscopia', 'label' => 'Rinoscopia / Nariz y Senos Paranasales', 'type' => 'textarea'],
                            ['id' => 'laringoscopia', 'label' => 'Orofaringe y Laringe', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Neurología',
                        'codigo' => 'NEURO',
                        'icono' => 'Brain',
                        'color' => '#6366f1',
                        'costo' => 65.00,
                        'duracion' => 40,
                        'descripcion' => 'Diagnóstico del sistema nervioso central y periférico.',
                        'plantilla' => [
                            ['id' => 'examen_neurologico', 'label' => 'Pares Craneales, Fuerza y Reflejos', 'type' => 'textarea'],
                            ['id' => 'estudios_neuro', 'label' => 'Electroencefalograma / Resonancia Magnética', 'type' => 'textarea'],
                            ['id' => 'diagnostico_neurologico', 'label' => 'Imprenta Diagnóstica y Plan', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Neurocirugía',
                        'codigo' => 'NEUROCI',
                        'icono' => 'BrainCircuit',
                        'color' => '#4c1d95',
                        'costo' => 80.00,
                        'duracion' => 45,
                        'descripcion' => 'Evaluación quirúrgica del encéfalo, columna vertebral y nervios.',
                        'plantilla' => [
                            ['id' => 'evaluacion_columna_encefalo', 'label' => 'Evaluación Neuroquirúrgica (TC/RMN Spine-Brain)', 'type' => 'textarea'],
                            ['id' => 'escala_glasgow', 'label' => 'Escala de Coma de Glasgow (GCS)', 'type' => 'number'],
                            ['id' => 'plan_neuroquirurgico', 'label' => 'Propuesta Quirúrgica', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Odontología General (Humana)',
                        'codigo' => 'ODONT-HUM',
                        'icono' => 'Smile',
                        'color' => '#0d9488',
                        'costo' => 40.00,
                        'duracion' => 30,
                        'descripcion' => 'Atención dental integral, limpiezas, restauraciones y odontograma.',
                        'plantilla' => [
                            ['id' => 'odontograma', 'label' => 'Odontograma Interactivo', 'type' => 'odontogram'],
                            ['id' => 'higiene_oral', 'label' => 'Índice de Higiene Oral', 'type' => 'select', 'options' => ['Buena', 'Regular', 'Deficiente']],
                            ['id' => 'tratamiento_odontologico', 'label' => 'Plan de Tratamiento por Pieza', 'type' => 'textarea'],
                        ],
                    ],
                ],
            ],
            [
                'nombre' => 'Oftalmología & Optometría',
                'slug' => 'oftalmologia-optometria',
                'icono' => 'Eye',
                'descripcion' => 'Atención de la salud visual, refracción, glaucoma, córnea y cirugía ocular.',
                'especialidades' => [
                    [
                        'nombre' => 'Oftalmología General',
                        'codigo' => 'OFT-GEN',
                        'icono' => 'Eye',
                        'color' => '#2563eb',
                        'costo' => 50.00,
                        'duracion' => 30,
                        'descripcion' => 'Consulta oftálmica integral, lámpara de hendidura y fondo de ojo.',
                        'plantilla' => [
                            ['id' => 'agudeza_visual', 'label' => 'Agudeza Visual (OD / OI)', 'type' => 'grid', 'fields' => [
                                ['id' => 'av_od_sc', 'label' => 'OD Sin Corrección', 'type' => 'text'],
                                ['id' => 'av_od_cc', 'label' => 'OD Con Corrección', 'type' => 'text'],
                                ['id' => 'av_oi_sc', 'label' => 'OI Sin Corrección', 'type' => 'text'],
                                ['id' => 'av_oi_cc', 'label' => 'OI Con Corrección', 'type' => 'text'],
                            ]],
                            ['id' => 'presion_intraocular', 'label' => 'Tonometría / Presión Intraocular (PIO)', 'type' => 'grid', 'fields' => [
                                ['id' => 'pio_od', 'label' => 'PIO Ojo Derecho (mmHg)', 'type' => 'number'],
                                ['id' => 'pio_oi', 'label' => 'PIO Ojo Izquierdo (mmHg)', 'type' => 'number'],
                            ]],
                            ['id' => 'lampara_hendidura', 'label' => 'Biomicroscopía (Lámpara de Hendidura)', 'type' => 'textarea'],
                            ['id' => 'fondo_ojo', 'label' => 'Fondo de Ojo / Retina', 'type' => 'textarea'],
                            ['id' => 'receta_optica', 'label' => 'Graduación / Receta de Lentes', 'type' => 'grid', 'fields' => [
                                ['id' => 'od_esfera', 'label' => 'OD Esfera', 'type' => 'text'],
                                ['id' => 'od_cilindro', 'label' => 'OD Cilindro', 'type' => 'text'],
                                ['id' => 'od_eje', 'label' => 'OD Eje (°)', 'type' => 'text'],
                                ['id' => 'oi_esfera', 'label' => 'OI Esfera', 'type' => 'text'],
                                ['id' => 'oi_cilindro', 'label' => 'OI Cilindro', 'type' => 'text'],
                                ['id' => 'oi_eje', 'label' => 'OI Eje (°)', 'type' => 'text'],
                                ['id' => 'adicion', 'label' => 'ADD (Adición)', 'type' => 'text'],
                            ]],
                        ],
                    ],
                    [
                        'nombre' => 'Optometría',
                        'codigo' => 'OPT',
                        'icono' => 'Glasses',
                        'color' => '#0284c7',
                        'costo' => 30.00,
                        'duracion' => 20,
                        'descripcion' => 'Examen refractivo, adaptación de lentes de contacto y visión binocular.',
                        'plantilla' => [
                            ['id' => 'subjetivo_refractor', 'label' => 'Examen Subjetivo y Refracción', 'type' => 'textarea'],
                            ['id' => 'distancia_interpupilar', 'label' => 'Distancia Interpupilar (DIP mm)', 'type' => 'text'],
                            ['id' => 'lentes_contacto', 'label' => 'Adaptación de Lentes de Contacto', 'type' => 'textarea'],
                        ],
                    ],
                ],
            ],
            [
                'nombre' => 'Odontología',
                'slug' => 'odontologia',
                'icono' => 'Smile',
                'descripcion' => 'Cuidado dental, odontograma, ortodoncia y cirugía maxilofacial.',
                'especialidades' => [
                    [
                        'nombre' => 'Odontología General',
                        'codigo' => 'ODONT-GEN',
                        'icono' => 'Smile',
                        'color' => '#0d9488',
                        'costo' => 40.00,
                        'duracion' => 30,
                        'descripcion' => 'Evaluación clínica dental, limpiezas y restauraciones.',
                        'plantilla' => [
                            ['id' => 'odontograma', 'label' => 'Odontograma Interactivo', 'type' => 'odontogram'],
                            ['id' => 'higiene_oral', 'label' => 'Índice de Higiene Oral / Placa Bacteriana', 'type' => 'select', 'options' => ['Buena', 'Regular', 'Deficiente']],
                            ['id' => 'tratamiento_odontologico', 'label' => 'Plan de Tratamiento y Presupuesto por Pieza', 'type' => 'textarea'],
                        ],
                    ],
                    [
                        'nombre' => 'Ortodoncia',
                        'codigo' => 'ORTO',
                        'icono' => 'Sparkles',
                        'color' => '#059669',
                        'costo' => 50.00,
                        'duracion' => 30,
                        'descripcion' => 'Alineación dental, brackets y ortopedia dentofacial.',
                        'plantilla' => [
                            ['id' => 'analisis_cefalometrico', 'label' => 'Análisis Cefalométrico y Fotográfico', 'type' => 'textarea'],
                            ['id' => 'fase_tratamiento', 'label' => 'Fase de Ortodoncia', 'type' => 'select', 'options' => ['Diagnóstico', 'Alineación y Nivelación', 'Cierre de Espacios', 'Detalle y Finalización', 'Retención']],
                        ],
                    ],
                ],
            ],
            [
                'nombre' => 'Veterinaria',
                'slug' => 'veterinaria',
                'icono' => 'PawPrint',
                'descripcion' => 'Salud animal para pequeñas mascotas, equinos y ganado.',
                'especialidades' => [
                    [
                        'nombre' => 'Veterinaria Pequeños Animales',
                        'codigo' => 'VET-PEQ',
                        'icono' => 'Dog',
                        'color' => '#d97706',
                        'costo' => 35.00,
                        'duracion' => 30,
                        'descripcion' => 'Consulta clínica para perros, gatos y pequeñas mascotas.',
                        'plantilla' => [
                            ['id' => 'datos_mascota', 'label' => 'Ficha del Paciente Animal', 'type' => 'grid', 'fields' => [
                                ['id' => 'nombre_mascota', 'label' => 'Nombre de la Mascota', 'type' => 'text', 'required' => true],
                                ['id' => 'especie', 'label' => 'Especie', 'type' => 'select', 'options' => ['Canino', 'Felino', 'Conejo', 'Ave', 'Otro']],
                                ['id' => 'raza', 'label' => 'Raza', 'type' => 'text'],
                                ['id' => 'microchip', 'label' => 'N° Microchip / Tatuaje', 'type' => 'text'],
                                ['id' => 'tutor_propietario', 'label' => 'Nombre del Tutor / Propietario', 'type' => 'text', 'required' => true],
                            ]],
                            ['id' => 'carnet_vacunacion', 'label' => 'Estado de Vacunación y Desparasitación', 'type' => 'textarea'],
                            ['id' => 'peso_temperatura_vet', 'label' => 'Constantes Fisiológicas (Peso kg, Temp °C, Frec. Cardíaca)', 'type' => 'textarea'],
                            ['id' => 'diagnostico_veterinario', 'label' => 'Diagnóstico y Receta Veterinaria', 'type' => 'textarea'],
                        ],
                    ],
                ],
            ],
            [
                'nombre' => 'Bienestar & Salud Integral',
                'slug' => 'bienestar-salud-integral',
                'icono' => 'Heart',
                'descripcion' => 'Fisioterapia, nutrición, psicología y terapias integrales.',
                'especialidades' => [
                    [
                        'nombre' => 'Nutrición y Dietética',
                        'codigo' => 'NUTRI',
                        'icono' => 'Apple',
                        'color' => '#65a30d',
                        'costo' => 40.00,
                        'duracion' => 45,
                        'descripcion' => 'Evaluación antropométrica, plan nutricional y composición corporal.',
                        'plantilla' => [
                            ['id' => 'composicion_corporal', 'label' => 'Evaluación Antropométrica', 'type' => 'grid', 'fields' => [
                                ['id' => 'porcentaje_grasa', 'label' => '% Grasa Corporal', 'type' => 'number'],
                                ['id' => 'masa_muscular', 'label' => 'Masa Muscular (kg)', 'type' => 'number'],
                                ['id' => 'grasa_visceral', 'label' => 'Nivel Grasa Visceral', 'type' => 'number'],
                            ]],
                            ['id' => 'plan_nutricional', 'label' => 'Plan de Alimentación y Calorías Diarias', 'type' => 'textarea'],
                        ],
                    ],
                ],
            ],
        ];

        foreach ($ramas as $ramaData) {
            $rama = RamaMedica::updateOrCreate(
                ['slug' => $ramaData['slug']],
                [
                    'nombre' => $ramaData['nombre'],
                    'icono' => $ramaData['icono'],
                    'descripcion' => $ramaData['descripcion'],
                    'status' => true,
                ]
            );

            foreach ($ramaData['especialidades'] as $espData) {
                $especialidad = Especialidad::updateOrCreate(
                    ['slug' => Str::slug($espData['nombre'])],
                    [
                        'rama_medica_id' => $rama->id,
                        'nombre' => $espData['nombre'],
                        'codigo' => $espData['codigo'],
                        'icono' => $espData['icono'],
                        'color' => $espData['color'],
                        'costo_consulta_sugerido' => $espData['costo'],
                        'duracion_consulta_minutos' => $espData['duracion'],
                        'descripcion' => $espData['descripcion'],
                        'status' => true,
                    ]
                );

                if (isset($espData['plantilla'])) {
                    PlantillaConsulta::updateOrCreate(
                        [
                            'especialidad_id' => $especialidad->id,
                            'nombre' => 'Plantilla Predeterminada - ' . $especialidad->nombre,
                        ],
                        [
                            'descripcion' => 'Plantilla pre-cargada automatizada del sistema para ' . $especialidad->nombre,
                            'estructura_json' => $espData['plantilla'],
                            'es_sistema' => true,
                            'status' => true,
                        ]
                    );
                }
            }
        }
    }
}
