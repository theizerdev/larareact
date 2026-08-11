<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionAsistencia;
use App\Models\DiaFestivo;
use App\Models\TurnoLaboral;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AsistenciaConfiguracionController extends Controller
{
    /**
     * Muestra el panel de configuración de asistencia, turnos y festivos LFT.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;

        // Obtener o crear configuración por defecto para la empresa
        $configuracion = ConfiguracionAsistencia::firstOrCreate(
            ['empresa_id' => $empresaId],
            [
                'tolerancia_retardo_minutos' => 10,
                'tolerancia_falta_minutos' => 30,
                'descanso_es_tiempo_efectivo' => false,
                'horas_extra_requieren_aprobacion' => true,
                'porcentaje_prima_dominical' => 25.00,
                'requiere_foto_marcaje' => false,
                'redondeo_marcaje_minutos' => 0,
            ]
        );

        // Cargar turnos de la empresa
        $turnos = TurnoLaboral::where('empresa_id', $empresaId)
            ->latest()
            ->get();

        // Cargar festivos ordenados por fecha
        $diasFestivos = DiaFestivo::where('empresa_id', $empresaId)
            ->orWhereNull('empresa_id')
            ->orderBy('fecha', 'asc')
            ->get();

        return Inertia::render('admin/asistencia/configuracion/Index', [
            'configuracion' => $configuracion,
            'turnos' => $turnos,
            'diasFestivos' => $diasFestivos,
        ]);
    }

    /**
     * Actualiza los parámetros generales de asistencia y LFT.
     */
    public function updateConfiguracion(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'tolerancia_retardo_minutos' => 'required|integer|min:0|max:120',
            'tolerancia_falta_minutos' => 'required|integer|min:0|max:240',
            'descanso_es_tiempo_efectivo' => 'required|boolean',
            'horas_extra_requieren_aprobacion' => 'required|boolean',
            'porcentaje_prima_dominical' => 'required|numeric|min:0|max:100',
            'requiere_foto_marcaje' => 'required|boolean',
            'redondeo_marcaje_minutos' => 'required|integer|in:0,5,10,15',
            'ley_silla_intervalo_horas' => 'nullable|numeric|min:0.5|max:12',
            'ley_silla_descanso_minutos' => 'nullable|integer|min:1|max:60',
            'whatsapp_recordatorio_descanso' => 'nullable|boolean',
            'whatsapp_recordatorio_horas_post_entrada' => 'nullable|numeric|min:0|max:12',
        ]);

        $configuracion = ConfiguracionAsistencia::firstOrCreate(['empresa_id' => $user->empresa_id]);
        $configuracion->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Configuración de asistencia actualizada con éxito.',
        ]);
    }

    /**
     * Guarda un nuevo turno laboral.
     */
    public function storeTurno(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo_jornada' => 'required|string|in:diurna,nocturna,mixta,personalizada',
            'hora_entrada' => 'required|date_format:H:i',
            'hora_salida' => 'required|date_format:H:i',
            'horas_diarias_ley' => 'required|numeric|min:1|max:24',
            'minutos_descanso' => 'required|integer|min:0|max:180',
            'descanso_pagado' => 'required|boolean',
            'dias_laborables' => 'required|array',
            'dias_laborables.*' => 'integer|between:1,7',
        ]);

        $validated['empresa_id'] = $user->empresa_id;
        $validated['status'] = true;

        TurnoLaboral::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Turno laboral registrado correctamente.',
        ]);
    }

    /**
     * Actualiza un turno existente.
     */
    public function updateTurno(Request $request, TurnoLaboral $turno)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'tipo_jornada' => 'required|string|in:diurna,nocturna,mixta,personalizada',
            'hora_entrada' => 'required|date_format:H:i',
            'hora_salida' => 'required|date_format:H:i',
            'horas_diarias_ley' => 'required|numeric|min:1|max:24',
            'minutos_descanso' => 'required|integer|min:0|max:180',
            'descanso_pagado' => 'required|boolean',
            'dias_laborables' => 'required|array',
            'dias_laborables.*' => 'integer|between:1,7',
        ]);

        $turno->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Turno laboral actualizado correctamente.',
        ]);
    }

    /**
     * Alterna el estado activo/inactivo del turno.
     */
    public function toggleTurnoStatus(TurnoLaboral $turno)
    {
        $turno->update(['status' => ! $turno->status]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Estado del turno actualizado.',
        ]);
    }

    /**
     * Elimina un turno laboral.
     */
    public function destroyTurno(TurnoLaboral $turno)
    {
        $turno->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Turno laboral eliminado.',
        ]);
    }

    /**
     * Registra un nuevo día festivo.
     */
    public function storeDiaFestivo(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'fecha' => 'required|date',
            'descripcion' => 'required|string|max:150',
            'es_oficial_lft' => 'required|boolean',
            'pago_porcentaje' => 'required|numeric|min:100|max:400',
        ]);

        $validated['empresa_id'] = $user->empresa_id;

        DiaFestivo::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Día festivo guardado correctamente.',
        ]);
    }

    /**
     * Actualiza un día festivo.
     */
    public function updateDiaFestivo(Request $request, DiaFestivo $diaFestivo)
    {
        $validated = $request->validate([
            'fecha' => 'required|date',
            'descripcion' => 'required|string|max:150',
            'es_oficial_lft' => 'required|boolean',
            'pago_porcentaje' => 'required|numeric|min:100|max:400',
        ]);

        $diaFestivo->update($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Día festivo actualizado.',
        ]);
    }

    /**
     * Elimina un día festivo.
     */
    public function destroyDiaFestivo(DiaFestivo $diaFestivo)
    {
        $diaFestivo->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Día festivo eliminado.',
        ]);
    }

    /**
     * Precarga los días festivos oficiales contemplados en el Art. 74 LFT México.
     */
    public function cargarFestivosOficialesLft(Request $request)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;
        $year = (int) date('Y');

        $festivosLft = [
            ['fecha' => "{$year}-01-01", 'descripcion' => 'Año Nuevo (Art. 74 I LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-02-05", 'descripcion' => 'Aniversario de la Constitución (Art. 74 II LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-03-21", 'descripcion' => 'Natalicio de Benito Juárez (Art. 74 III LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-05-01", 'descripcion' => 'Día del Trabajo (Art. 74 IV LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-09-16", 'descripcion' => 'Día de la Independencia (Art. 74 V LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-11-20", 'descripcion' => 'Aniversario de la Revolución (Art. 74 VI LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
            ['fecha' => "{$year}-12-25", 'descripcion' => 'Navidad (Art. 74 VIII LFT)', 'es_oficial_lft' => true, 'pago_porcentaje' => 200.00],
        ];

        foreach ($festivosLft as $f) {
            DiaFestivo::updateOrCreate(
                [
                    'empresa_id' => $empresaId,
                    'fecha' => $f['fecha'],
                ],
                $f
            );
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Se han precargado los días festivos oficiales para el año {$year}.",
        ]);
    }
}
