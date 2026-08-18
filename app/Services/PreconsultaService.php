<?php

namespace App\Services;

use App\Models\Cita;
use App\Models\CitaPreconsulta;
use App\Models\PlantillaPreconsulta;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PreconsultaService
{
    /**
     * Busca la plantilla de cuestionario adecuada según especialidad o tipo de atención.
     */
    public function obtenerPlantillaParaCita(Cita $cita): ?PlantillaPreconsulta
    {
        // 1. Coincidencia por especialidad y tipo de atención específicos
        $plantilla = PlantillaPreconsulta::where('is_active', true)
            ->where(function ($q) use ($cita) {
                if ($cita->especialidad_id) {
                    $q->where('especialidad_id', $cita->especialidad_id);
                }
                if ($cita->tipo_atencion_id) {
                    $q->orWhere('tipo_atencion_id', $cita->tipo_atencion_id);
                }
            })
            ->first();

        // 2. Fallback a plantilla por defecto/general
        if (!$plantilla) {
            $plantilla = PlantillaPreconsulta::where('is_active', true)
                ->whereNull('especialidad_id')
                ->whereNull('tipo_atencion_id')
                ->first();
        }

        return $plantilla;
    }

    /**
     * Genera o recupera el token de pre-consulta único para una cita.
     */
    public function obtenerOGenerarPreconsulta(Cita $cita): CitaPreconsulta
    {
        if ($cita->preconsulta) {
            return $cita->preconsulta;
        }

        $plantilla = $this->obtenerPlantillaParaCita($cita);

        return CitaPreconsulta::create([
            'cita_id' => $cita->id,
            'plantilla_id' => $plantilla?->id,
            'token' => Str::random(32),
            'completado' => false,
        ]);
    }

    /**
     * Guarda las respuestas enviadas por el paciente.
     */
    public function guardarRespuestas(CitaPreconsulta $preconsulta, array $respuestas, ?string $ipOrigen = null): bool
    {
        $preconsulta->update([
            'respuestas' => $respuestas,
            'completado' => true,
            'completado_at' => Carbon::now(),
            'ip_origen' => $ipOrigen,
        ]);

        return true;
    }
}
