<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\TipoAtencion;
use Illuminate\Database\Seeder;

class TipoAtencionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresas = Empresa::all();

        if ($empresas->isEmpty()) {
            $this->seedTiposAtencion(null);
            return;
        }

        foreach ($empresas as $empresa) {
            $this->seedTiposAtencion($empresa->id);
        }
    }

    private function seedTiposAtencion(?int $empresaId): void
    {
        $tipos = [
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Consulta Presencial Primera Vez',
                'slug' => 'consulta-presencial-primera-vez',
                'codigo' => 'PRESENCIAL_PRIMERA',
                'modalidad' => 'presencial',
                'tipo_consulta' => 'primera_vez',
                'es_primera_vez' => true,
                'es_subsecuente' => false,
                'descripcion' => 'Evaluación clínica inicial en instalaciones médicas para pacientes nuevos.',
                'icono' => 'UserPlus',
                'color' => '#3b82f6',
                'duracion_estimada_minutos' => 45,
                'requiere_link_virtual' => false,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Consulta Presencial Control / Subsecuente',
                'slug' => 'consulta-presencial-subsecuente',
                'codigo' => 'PRESENCIAL_SUBSECUENTE',
                'modalidad' => 'presencial',
                'tipo_consulta' => 'subsecuente',
                'es_primera_vez' => false,
                'es_subsecuente' => true,
                'descripcion' => 'Seguimiento y revisión médica periódica para pacientes en tratamiento.',
                'icono' => 'Repeat',
                'color' => '#10b981',
                'duracion_estimada_minutos' => 30,
                'requiere_link_virtual' => false,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Telemedicina / Consulta Virtual (Primera Vez)',
                'slug' => 'telemedicina-primera-vez',
                'codigo' => 'TELEMEDICINA_PRIMERA',
                'modalidad' => 'telemedicina',
                'tipo_consulta' => 'primera_vez',
                'es_primera_vez' => true,
                'es_subsecuente' => false,
                'descripcion' => 'Atención médica inicial a distancia mediante videollamada remota.',
                'icono' => 'Video',
                'color' => '#8b5cf6',
                'duracion_estimada_minutos' => 45,
                'requiere_link_virtual' => true,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Telemedicina / Consulta Virtual (Control)',
                'slug' => 'telemedicina-control-subsecuente',
                'codigo' => 'TELEMEDICINA_SUBSECUENTE',
                'modalidad' => 'telemedicina',
                'tipo_consulta' => 'subsecuente',
                'es_primera_vez' => false,
                'es_subsecuente' => true,
                'descripcion' => 'Revisión de resultados y seguimiento médico por videollamada.',
                'icono' => 'Video',
                'color' => '#a855f7',
                'duracion_estimada_minutos' => 30,
                'requiere_link_virtual' => true,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Atención Médica Domiciliaria',
                'slug' => 'atencion-medica-domiciliaria',
                'codigo' => 'DOMICILIO',
                'modalidad' => 'domicilio',
                'tipo_consulta' => 'general',
                'es_primera_vez' => false,
                'es_subsecuente' => false,
                'descripcion' => 'Visita y evaluación clínica presencial en la dirección del paciente.',
                'icono' => 'Home',
                'color' => '#059669',
                'duracion_estimada_minutos' => 60,
                'requiere_link_virtual' => false,
                'requiere_direccion' => true,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Urgencia / Atención Prioritaria',
                'slug' => 'urgencia-atencion-prioritaria',
                'codigo' => 'URGENCIA',
                'modalidad' => 'urgencia',
                'tipo_consulta' => 'general',
                'es_primera_vez' => false,
                'es_subsecuente' => false,
                'descripcion' => 'Atención médica inmediata sin cita previa para evaluación de síntomas agudos.',
                'icono' => 'AlertTriangle',
                'color' => '#ef4444',
                'duracion_estimada_minutos' => 20,
                'requiere_link_virtual' => false,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => false,
                'status' => true,
            ],
            [
                'empresa_id' => $empresaId,
                'nombre' => 'Procedimiento / Examen Médico',
                'slug' => 'procedimiento-examen-medico',
                'codigo' => 'PROCEDIMIENTO',
                'modalidad' => 'procedimiento',
                'tipo_consulta' => 'procedimiento',
                'es_primera_vez' => false,
                'es_subsecuente' => false,
                'descripcion' => 'Intervención menor o toma de muestras diagnósticas en la clínica.',
                'icono' => 'Stethoscope',
                'color' => '#f59e0b',
                'duracion_estimada_minutos' => 60,
                'requiere_link_virtual' => false,
                'requiere_direccion' => false,
                'costo_adicional_sugerido' => null,
                'permite_reserva_online' => true,
                'status' => true,
            ],
        ];

        foreach ($tipos as $tipoData) {
            TipoAtencion::updateOrCreate(
                [
                    'empresa_id' => $empresaId,
                    'codigo' => $tipoData['codigo'],
                ],
                $tipoData
            );
        }
    }
}
