<?php

namespace Database\Seeders;

use App\Models\CatalogoEstudio;
use App\Models\DiagnosticoCie10;
use App\Models\Especialidad;
use Illuminate\Database\Seeder;

class Cie10YEstudiosPorEspecialidadSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $especialidades = Especialidad::all();

        // Helper para buscar ID por coincidencia de nombre
        $getEspId = function ($searchName) use ($especialidades) {
            $esp = $especialidades->first(function ($e) use ($searchName) {
                return str_contains(mb_strtolower($e->nombre), mb_strtolower($searchName));
            });
            return $esp ? $esp->id : null;
        };

        $medicinaGeneralId = $getEspId('Medicina General');
        $pediatriaId = $getEspId('Pediatría');
        $ginecologiaId = $getEspId('Ginecología');
        $cardiologiaId = $getEspId('Cardiología');
        $gastroenterologiaId = $getEspId('Gastroenterología');
        $neurologiaId = $getEspId('Neurología');
        $otorrinoId = $getEspId('Otorrinolaringología');
        $oftalmologiaId = $getEspId('Oftalmología');
        $odontologiaId = $getEspId('Odontología');
        $veterinariaId = $getEspId('Veterinaria');
        $nutricionId = $getEspId('Nutrición');

        // -------------------------------------------------------------
        // 1. DIAGNÓSTICOS CIE-10 POR ESPECIALIDAD
        // -------------------------------------------------------------
        $diagnosticos = [
            // General / Medicina Familiar
            ['codigo' => 'J00', 'nombre' => 'Rinitis aguda (Resfriado común)', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'J02.9', 'nombre' => 'Faringitis aguda, no especificada', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'J03.9', 'nombre' => 'Amigdalitis aguda, no especificada', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'J20.9', 'nombre' => 'Bronquitis aguda, no especificada', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'I10', 'nombre' => 'Hipertensión esencial (primaria)', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'E11.9', 'nombre' => 'Diabetes mellitus tipo 2 sin complicaciones', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'K29.7', 'nombre' => 'Gastritis, no especificada', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'M54.5', 'nombre' => 'Lumbago no especificado', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'R51', 'nombre' => 'Cefalea', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'R50.9', 'nombre' => 'Fiebre, no especificada', 'especialidad_id' => $medicinaGeneralId],
            ['codigo' => 'B34.9', 'nombre' => 'Infección viral, no especificada', 'especialidad_id' => $medicinaGeneralId],

            // Pediatría
            ['codigo' => 'J21.9', 'nombre' => 'Bronquiolitis aguda, no especificada', 'especialidad_id' => $pediatriaId],
            ['codigo' => 'A09', 'nombre' => 'Diarrea y gastroenteritis de presunto origen infeccioso', 'especialidad_id' => $pediatriaId],
            ['codigo' => 'H66.9', 'nombre' => 'Otitis media, no especificada', 'especialidad_id' => $pediatriaId],
            ['codigo' => 'J45.9', 'nombre' => 'Asma infantil, no especificada', 'especialidad_id' => $pediatriaId],
            ['codigo' => 'L20.9', 'nombre' => 'Dermatitis atópica, no especificada', 'especialidad_id' => $pediatriaId],
            ['codigo' => 'B08.4', 'nombre' => 'Estomatitis vesicular enterovárica con exantema (Boca-Mano-Pie)', 'especialidad_id' => $pediatriaId],

            // Ginecología y Obstetricia
            ['codigo' => 'N76.0', 'nombre' => 'Vaginitis aguda / Vaginosis bacteriana', 'especialidad_id' => $ginecologiaId],
            ['codigo' => 'B37.3', 'nombre' => 'Candidiasis de la vulva y de la vagina', 'especialidad_id' => $ginecologiaId],
            ['codigo' => 'Z34.8', 'nombre' => 'Supervisión de otro embarazo normal (Control Prenatal)', 'especialidad_id' => $ginecologiaId],
            ['codigo' => 'E28.2', 'nombre' => 'Síndrome de ovario poliquístico (SOP)', 'especialidad_id' => $ginecologiaId],
            ['codigo' => 'N94.6', 'nombre' => 'Dismenorrea no especificada', 'especialidad_id' => $ginecologiaId],
            ['codigo' => 'O23.4', 'nombre' => 'Infección no especificada de las vías urinarias en el embarazo', 'especialidad_id' => $ginecologiaId],

            // Cardiología
            ['codigo' => 'I11.9', 'nombre' => 'Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca', 'especialidad_id' => $cardiologiaId],
            ['codigo' => 'I25.9', 'nombre' => 'Enfermedad isquémica crónica del corazón', 'especialidad_id' => $cardiologiaId],
            ['codigo' => 'I48.9', 'nombre' => 'Fibrilación y aleteo auricular, no especificado', 'especialidad_id' => $cardiologiaId],
            ['codigo' => 'I50.9', 'nombre' => 'Insuficiencia cardíaca, no especificada', 'especialidad_id' => $cardiologiaId],
            ['codigo' => 'E78.5', 'nombre' => 'Hyperlipidemia, no especificada (Dislipidemia)', 'especialidad_id' => $cardiologiaId],

            // Gastroenterología
            ['codigo' => 'K21.9', 'nombre' => 'Enfermedad por reflujo gastroesofágico sin esofagitis (ERGE)', 'especialidad_id' => $gastroenterologiaId],
            ['codigo' => 'K58.9', 'nombre' => 'Síndrome del colon irritable sin diarrea', 'especialidad_id' => $gastroenterologiaId],
            ['codigo' => 'K80.2', 'nombre' => 'Cálculo de la vesícula biliar sin colecistitis (Colelitiasis)', 'especialidad_id' => $gastroenterologiaId],
            ['codigo' => 'K76.0', 'nombre' => 'Hígado graso no alcohólico (Esteatosis hepática)', 'especialidad_id' => $gastroenterologiaId],

            // Neurología
            ['codigo' => 'G43.9', 'nombre' => 'Migraña, no especificada', 'especialidad_id' => $neurologiaId],
            ['codigo' => 'G40.9', 'nombre' => 'Epilepsia, no especificada', 'especialidad_id' => $neurologiaId],
            ['codigo' => 'G44.2', 'nombre' => 'Cefalea debida a tensión muscular', 'especialidad_id' => $neurologiaId],

            // Otorrinolaringología
            ['codigo' => 'H60.9', 'nombre' => 'Otitis externa, sin otra especificación', 'especialidad_id' => $otorrinoId],
            ['codigo' => 'J32.9', 'nombre' => 'Sinusitis crónica, no especificada', 'especialidad_id' => $otorrinoId],
            ['codigo' => 'H81.1', 'nombre' => 'Vértigo paroxístico benigno', 'especialidad_id' => $otorrinoId],

            // Oftalmología / Optometría
            ['codigo' => 'H10.9', 'nombre' => 'Conjuntivitis, no especificada', 'especialidad_id' => $oftalmologiaId],
            ['codigo' => 'H52.1', 'nombre' => 'Miopía', 'especialidad_id' => $oftalmologiaId],
            ['codigo' => 'H52.2', 'nombre' => 'Astigmatismo', 'especialidad_id' => $oftalmologiaId],
            ['codigo' => 'H52.4', 'nombre' => 'Presbicia', 'especialidad_id' => $oftalmologiaId],

            // Odontología
            ['codigo' => 'K02.9', 'nombre' => 'Caries dental, no especificada', 'especialidad_id' => $odontologiaId],
            ['codigo' => 'K05.0', 'nombre' => 'Gingivitis aguda', 'especialidad_id' => $odontologiaId],
            ['codigo' => 'K05.3', 'nombre' => 'Periodontitis crónica', 'especialidad_id' => $odontologiaId],
            ['codigo' => 'K04.0', 'nombre' => 'Pulpitis irreversible', 'especialidad_id' => $odontologiaId],
            ['codigo' => 'K04.7', 'nombre' => 'Absceso periapical sin fístula', 'especialidad_id' => $odontologiaId],

            // Nutrición
            ['codigo' => 'E66.9', 'nombre' => 'Obesidad, no especificada', 'especialidad_id' => $nutricionId],
            ['codigo' => 'E63.9', 'nombre' => 'Deficiencia nutricional, no especificada', 'especialidad_id' => $nutricionId],
        ];

        foreach ($diagnosticos as $d) {
            DiagnosticoCie10::updateOrCreate(
                ['codigo' => $d['codigo']],
                [
                    'nombre' => $d['nombre'],
                    'especialidad_id' => $d['especialidad_id'],
                    'status' => true,
                ]
            );
        }

        // -------------------------------------------------------------
        // 2. ESTUDIOS SOLICITADOS (CATÁLOGO) POR ESPECIALIDAD
        // -------------------------------------------------------------
        $estudios = [
            // Medicina General
            ['nombre_estudio' => 'Hemograma Completo (Hematología)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'En ayunas de 8 horas', 'especialidad_id' => $medicinaGeneralId],
            ['nombre_estudio' => 'Perfil Lipídico (Colesterol, Triglicéridos)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Ayuno estricto de 12 horas', 'especialidad_id' => $medicinaGeneralId],
            ['nombre_estudio' => 'Glucemia en Ayunas', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Ayuno de 8 a 10 horas', 'especialidad_id' => $medicinaGeneralId],
            ['nombre_estudio' => 'Urea y Creatinina (Función Renal)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Sin preparación especial', 'especialidad_id' => $medicinaGeneralId],
            ['nombre_estudio' => 'Examen General de Orina (EGO)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Primera orina de la mañana', 'especialidad_id' => $medicinaGeneralId],
            ['nombre_estudio' => 'Perfil Hepático (TGO, TGP, Bilirrubina)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'En ayunas de 8 horas', 'especialidad_id' => $medicinaGeneralId],

            // Pediatría
            ['nombre_estudio' => 'Hemograma Completo Pediátrico', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Muestra capilar o venosa', 'especialidad_id' => $pediatriaId],
            ['nombre_estudio' => 'Coproanálisis / Examen de Heces', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Muestra fresca en frasco estéril', 'especialidad_id' => $pediatriaId],
            ['nombre_estudio' => 'Test Rápido para Streptococcus Grupo A', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Hisopado faríngeo', 'especialidad_id' => $pediatriaId],

            // Ginecología y Obstetricia
            ['nombre_estudio' => 'Ecografía Pélvica / Transvaginal', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Vejiga llena si es pélvica', 'especialidad_id' => $ginecologiaId],
            ['nombre_estudio' => 'Ecografía Obstétrica Morfológica', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Según semana de gestación', 'especialidad_id' => $ginecologiaId],
            ['nombre_estudio' => 'Citología Vaginal (Papanicolaou)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Sin ducha vaginal previa 24h', 'especialidad_id' => $ginecologiaId],
            ['nombre_estudio' => 'Perfil Hormonal Femenino (FSH, LH, Estradiol, Prolactina)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Tomar entre días 2 al 5 del ciclo', 'especialidad_id' => $ginecologiaId],
            ['nombre_estudio' => 'Prueba de Embarazo Subunidad Beta hCG Cuantitativa', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Muestra sanguínea en ayunas', 'especialidad_id' => $ginecologiaId],

            // Cardiología
            ['nombre_estudio' => 'Electrocardiograma (ECG 12 derivaciones)', 'tipo_estudio' => 'Electrofisiología', 'indicaciones_predeterminadas' => 'Sin café ni bebidas energizantes previa', 'especialidad_id' => $cardiologiaId],
            ['nombre_estudio' => 'Ecocardiograma Transtorácico', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Sin preparación especial', 'especialidad_id' => $cardiologiaId],
            ['nombre_estudio' => 'Holter de Arritmias de 24 Horas', 'tipo_estudio' => 'Electrofisiología', 'indicaciones_predeterminadas' => 'Bañarse antes del colocado', 'especialidad_id' => $cardiologiaId],
            ['nombre_estudio' => 'Prueba de Esfuerzo (Ergometría)', 'tipo_estudio' => 'Electrofisiología', 'indicaciones_predeterminadas' => 'Calzado deportivo y ropa cómoda', 'especialidad_id' => $cardiologiaId],
            ['nombre_estudio' => 'Troponina I y Enzimas Cardíacas (CK-MB)', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Procesamiento de urgencia', 'especialidad_id' => $cardiologiaId],

            // Gastroenterología
            ['nombre_estudio' => 'Endoscopia Digestiva Alta (EDA)', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Ayuno estricto de 8 horas con acompañante', 'especialidad_id' => $gastroenterologiaId],
            ['nombre_estudio' => 'Colonoscopia Total', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Preparación evacuante intestinal previa', 'especialidad_id' => $gastroenterologiaId],
            ['nombre_estudio' => 'Test de Aliento para Helicobacter Pylori', 'tipo_estudio' => 'Laboratorio', 'indicaciones_predeterminadas' => 'Suspender omeprazol 14 días antes', 'especialidad_id' => $gastroenterologiaId],

            // Neurología
            ['nombre_estudio' => 'Electroencefalograma (EEG)', 'tipo_estudio' => 'Electrofisiología', 'indicaciones_predeterminadas' => 'Cabello limpio y desvelo previo si aplica', 'especialidad_id' => $neurologiaId],
            ['nombre_estudio' => 'Resonancia Magnética Cerebral (RM)', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Sin objetos ni implantes metálicos', 'especialidad_id' => $neurologiaId],

            // Otorrinolaringología
            ['nombre_estudio' => 'Audiometría Tonal y Logoaudiometría', 'tipo_estudio' => 'Otro', 'indicaciones_predeterminadas' => 'Reposo auditivo 14 horas previas', 'especialidad_id' => $otorrinoId],
            ['nombre_estudio' => 'Nasofibrolaringoscopia', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Ayuno corto de 2 horas', 'especialidad_id' => $otorrinoId],

            // Oftalmología
            ['nombre_estudio' => 'Tonometría y Medición de Presión Intraocular', 'tipo_estudio' => 'Otro', 'indicaciones_predeterminadas' => 'Sin lentes de contacto', 'especialidad_id' => $oftalmologiaId],
            ['nombre_estudio' => 'Examen de Fondo de Ojo con Mapeo de Retina', 'tipo_estudio' => 'Otro', 'indicaciones_predeterminadas' => 'Gotas midriáticas (acompañante)', 'especialidad_id' => $oftalmologiaId],

            // Odontología
            ['nombre_estudio' => 'Radiografía Periapical', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Tomar en sillón dental', 'especialidad_id' => $odontologiaId],
            ['nombre_estudio' => 'Radiografía Panorámica Dental (Ortopantomografía)', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Retirar aretes, piercings y prótesis', 'especialidad_id' => $odontologiaId],
            ['nombre_estudio' => 'Tomografía Odontológica Cone Beam (CBCT Maxilar)', 'tipo_estudio' => 'Imagenología', 'indicaciones_predeterminadas' => 'Evaluación tomográfica 3D', 'especialidad_id' => $odontologiaId],
        ];

        foreach ($estudios as $e) {
            CatalogoEstudio::updateOrCreate(
                ['nombre_estudio' => $e['nombre_estudio']],
                [
                    'tipo_estudio' => $e['tipo_estudio'],
                    'indicaciones_predeterminadas' => $e['indicaciones_predeterminadas'],
                    'especialidad_id' => $e['especialidad_id'],
                    'status' => true,
                ]
            );
        }
    }
}
