<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cita;
use App\Models\ConsultaMedica;
use App\Models\Especialidad;
use App\Models\Medico;
use App\Models\RecetaMedica;
use App\Models\RecetaMedicamento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ConsultaMedicaController extends Controller
{
    /**
     * Vista dedicada de Sala de Espera con tabla de alta densidad y métricas.
     */
    public function salaDeEspera(Request $request)
    {
        return $this->renderConsultaView($request, 'sala_de_espera', 'admin/Consultas/SalaDeEspera');
    }

    /**
     * Vista dedicada de En Consultorio con tabla de alta densidad y métricas.
     */
    public function enConsultorio(Request $request)
    {
        return $this->renderConsultaView($request, 'en_consultorio', 'admin/Consultas/EnConsultorio');
    }

    /**
     * Vista dedicada de Consultas Finalizadas con tabla de alta densidad y métricas.
     */
    public function finalizadas(Request $request)
    {
        return $this->renderConsultaView($request, 'finalizada', 'admin/Consultas/Finalizadas');
    }

    private function renderConsultaView(Request $request, string $estado, string $inertiaView)
    {
        $empresaId = Auth::user()->empresa_id;
        $perPage = (int) $request->input('per_page', 15);

        // Subquery general para contar totales
        $baseQuery = ConsultaMedica::where('empresa_id', $empresaId)->where('estado', $estado);

        $totalConsultas = (clone $baseQuery)->count();
        $consultasHoyCount = (clone $baseQuery)->whereDate('created_at', now()->toDateString())->count();

        // Conteo por médico
        $consultasPorMedico = Medico::where('empresa_id', $empresaId)
            ->withCount(['consultas' => function ($q) use ($estado) {
                $q->where('estado', $estado);
            }])
            ->get(['id', 'nombres', 'apellidos'])
            ->map(function ($medico) {
                return [
                    'id' => $medico->id,
                    'nombre_completo' => "Dr(a). {$medico->nombres} {$medico->apellidos}",
                    'total' => $medico->consultas_count,
                ];
            })
            ->filter(fn($m) => $m['total'] > 0)
            ->values();

        // Query principal con filtros
        $query = ConsultaMedica::with([
            'cita',
            'paciente',
            'medico',
            'especialidad',
            'cita.preconsulta.plantilla',
            'receta.medicamentos',
            'ordenEstudio.estudios',
            'reposo',
        ])
        ->where('empresa_id', $empresaId)
        ->where('estado', $estado);

        // Búsqueda por texto (paciente, médico, código cita)
        if ($request->filled('search')) {
            $search = strtolower($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->whereHas('paciente', function ($qp) use ($search) {
                    $qp->where(DB::raw('LOWER(nombres)'), 'like', "%{$search}%")
                       ->orWhere(DB::raw('LOWER(apellidos)'), 'like', "%{$search}%")
                       ->orWhere(DB::raw('LOWER(nombre_mascota)'), 'like', "%{$search}%")
                       ->orWhere(DB::raw('LOWER(codigo_paciente)'), 'like', "%{$search}%");
                })
                ->orWhereHas('cita', function ($qc) use ($search) {
                    $qc->where(DB::raw('LOWER(codigo_cita)'), 'like', "%{$search}%");
                })
                ->orWhereHas('medico', function ($qm) use ($search) {
                    $qm->where(DB::raw('LOWER(nombres)'), 'like', "%{$search}%")
                       ->orWhere(DB::raw('LOWER(apellidos)'), 'like', "%{$search}%");
                });
            });
        }

        // Filtro por médico
        if ($request->filled('medico_id')) {
            $query->where('medico_id', $request->input('medico_id'));
        }

        // Filtro por fecha específica
        if ($request->filled('fecha')) {
            $query->whereDate('created_at', $request->input('fecha'));
        }

        $consultas = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        $medicos = Medico::where('empresa_id', $empresaId)->get(['id', 'nombres', 'apellidos']);
        $especialidades = Especialidad::where('status', true)->get(['id', 'nombre']);

        return Inertia::render($inertiaView, [
            'consultas' => $consultas,
            'totalConsultas' => $totalConsultas,
            'consultasHoy' => $consultasHoyCount,
            'consultasPorMedico' => $consultasPorMedico,
            'medicos' => $medicos,
            'especialidades' => $especialidades,
            'filters' => $request->only(['search', 'medico_id', 'fecha', 'per_page']),
        ]);
    }

    /**
     * Carga el Wizard Clínico de Atención Médica para una Cita / Consulta.
     */
    public function atencion(Cita $cita)
    {
        // Asegurar que la consulta exista en estado 'en_consultorio'
        $consulta = ConsultaMedica::firstOrCreate(
            ['cita_id' => $cita->id],
            [
                'empresa_id' => $cita->empresa_id,
                'paciente_id' => $cita->paciente_id,
                'medico_id' => $cita->medico_id,
                'especialidad_id' => $cita->especialidad_id,
                'motivo_consulta' => $cita->motivo_consulta,
                'estado' => 'en_consultorio',
            ]
        );

        if ($consulta->estado === 'sala_de_espera') {
            $consulta->update(['estado' => 'en_consultorio']);
            $cita->update(['estado' => 'en_consulta']);
        }

        $cita->load([
            'paciente',
            'medico',
            'especialidad',
            'tipoAtencion',
            'preconsulta.plantilla',
            'consulta.receta.medicamentos',
            'consulta.ordenEstudio.estudios',
            'consulta.diagnosticosCie10',
            'consulta.reposo',
        ]);

        $catalogoCie10 = \App\Models\DiagnosticoCie10::where(function ($q) use ($cita) {
            $q->whereNull('empresa_id')->orWhere('empresa_id', $cita->empresa_id);
        })
        ->where(function ($q) use ($cita) {
            $q->whereNull('especialidad_id')->orWhere('especialidad_id', $cita->especialidad_id);
        })
        ->where('status', true)
        ->orderBy('codigo', 'asc')
        ->get(['id', 'codigo', 'nombre', 'especialidad_id']);

        $catalogoEstudios = \App\Models\CatalogoEstudio::where(function ($q) use ($cita) {
            $q->whereNull('empresa_id')->orWhere('empresa_id', $cita->empresa_id);
        })
        ->where(function ($q) use ($cita) {
            $q->whereNull('especialidad_id')->orWhere('especialidad_id', $cita->especialidad_id);
        })
        ->where('status', true)
        ->orderBy('nombre_estudio', 'asc')
        ->get(['id', 'tipo_estudio', 'nombre_estudio', 'indicaciones_predeterminadas', 'especialidad_id']);

        return Inertia::render('admin/Consultas/Atencion', [
            'cita' => $cita,
            'consultaExistente' => $consulta,
            'catalogoCie10Inicial' => $catalogoCie10,
            'catalogoEstudiosInicial' => $catalogoEstudios,
        ]);
    }

    /**
     * Guarda un nuevo diagnóstico CIE-10 personalizado desde el modal.
     */
    public function storeDiagnosticoCie10(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:20',
            'nombre' => 'required|string|max:255',
            'especialidad_id' => 'nullable|exists:especialidades,id',
        ]);

        $empresaId = Auth::user()->empresa_id;

        $diagnostico = \App\Models\DiagnosticoCie10::create([
            'empresa_id' => $empresaId,
            'especialidad_id' => $validated['especialidad_id'] ?? null,
            'codigo' => strtoupper(trim($validated['codigo'])),
            'nombre' => trim($validated['nombre']),
            'status' => true,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => '¡Diagnóstico CIE-10 creado con éxito!',
                'diagnostico' => $diagnostico,
            ]);
        }

        return back()->with([
            'success' => '¡Diagnóstico CIE-10 creado con éxito!',
            'nuevoDiagnostico' => $diagnostico,
        ]);
    }

    /**
     * Guarda un nuevo estudio en el catálogo de sugerencias.
     */
    public function storeEstudioCatalogo(Request $request)
    {
        $validated = $request->validate([
            'tipo_estudio' => 'required|string|max:50',
            'nombre_estudio' => 'required|string|max:255',
            'indicaciones_predeterminadas' => 'nullable|string',
            'especialidad_id' => 'nullable|exists:especialidades,id',
        ]);

        $empresaId = Auth::user()->empresa_id;

        $estudio = \App\Models\CatalogoEstudio::create([
            'empresa_id' => $empresaId,
            'especialidad_id' => $validated['especialidad_id'] ?? null,
            'tipo_estudio' => $validated['tipo_estudio'],
            'nombre_estudio' => trim($validated['nombre_estudio']),
            'indicaciones_predeterminadas' => $validated['indicaciones_predeterminadas'] ?? 'En ayunas de 8 horas',
            'status' => true,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => '¡Estudio registrado en el catálogo con éxito!',
                'estudio' => $estudio,
            ]);
        }

        return back()->with([
            'success' => '¡Estudio registrado en el catálogo con éxito!',
            'nuevoEstudioCatalogo' => $estudio,
        ]);
    }

    /**
     * Guarda la consulta médica completa, calcula IMC, emite receta, orden de estudios y finaliza el ciclo.
     */
    public function store(Request $request, Cita $cita)
    {
        $validated = $request->validate([
            'motivo_consulta' => 'nullable|string',
            'enfermedad_actual' => 'nullable|string',
            'examen_fisico' => 'nullable|string',
            'presion_arterial' => 'nullable|string',
            'frecuencia_cardiaca' => 'nullable|integer',
            'temperatura' => 'nullable|numeric',
            'peso_kg' => 'nullable|numeric',
            'talla_cm' => 'nullable|numeric',
            'spo2' => 'nullable|integer',
            'diagnostico_cie10_codigo' => 'nullable|string',
            'diagnostico_cie10_nombre' => 'nullable|string',
            'observaciones_diagnostico' => 'nullable|string',
            'conclusion' => 'nullable|string',
            'plan_tratamiento' => 'nullable|string',
            'observaciones_adicionales' => 'nullable|string',

            'diagnosticos_cie10_lista' => 'nullable|array',
            'diagnosticos_cie10_lista.*.codigo' => 'required_with:diagnosticos_cie10_lista|string',
            'diagnosticos_cie10_lista.*.nombre' => 'required_with:diagnosticos_cie10_lista|string',
            'diagnosticos_cie10_lista.*.tipo' => 'nullable|string',
            'diagnosticos_cie10_lista.*.observaciones' => 'nullable|string',

            'indicaciones_generales' => 'nullable|string',
            'medicamentos' => 'nullable|array',
            'medicamentos.*.medicamento_nombre' => 'required_with:medicamentos|string',
            'medicamentos.*.dosis' => 'nullable|string',
            'medicamentos.*.via_administracion' => 'nullable|string',
            'medicamentos.*.frecuencia' => 'nullable|string',
            'medicamentos.*.duracion_dias' => 'nullable|integer',
            'medicamentos.*.instrucciones' => 'nullable|string',

            'indicaciones_estudios' => 'nullable|string',
            'estudios_solicitados' => 'nullable|array',
            'estudios_solicitados.*.tipo_estudio' => 'nullable|string',
            'estudios_solicitados.*.nombre_estudio' => 'required_with:estudios_solicitados|string',
            'estudios_solicitados.*.indicaciones' => 'nullable|string',

            'tiene_reposo' => 'nullable|boolean',
            'tipo_reposo' => 'nullable|string',
            'dias_reposo' => 'nullable|integer|min:1',
            'fecha_inicio_reposo' => 'nullable|date',
            'fecha_fin_reposo' => 'nullable|date',
            'motivo_reposo' => 'nullable|string',
            'observaciones_reposo' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $cita) {
            $imc = null;
            if (!empty($validated['peso_kg']) && !empty($validated['talla_cm']) && $validated['talla_cm'] > 0) {
                $tallaMetros = $validated['talla_cm'] / 100;
                $imc = round($validated['peso_kg'] / ($tallaMetros * $tallaMetros), 2);
            }

            $consulta = ConsultaMedica::updateOrCreate(
                ['cita_id' => $cita->id],
                [
                    'empresa_id' => $cita->empresa_id,
                    'paciente_id' => $cita->paciente_id,
                    'medico_id' => $cita->medico_id,
                    'especialidad_id' => $cita->especialidad_id,
                    'motivo_consulta' => $validated['motivo_consulta'] ?? null,
                    'enfermedad_actual' => $validated['enfermedad_actual'] ?? null,
                    'examen_fisico' => $validated['examen_fisico'] ?? null,
                    'presion_arterial' => $validated['presion_arterial'] ?? null,
                    'frecuencia_cardiaca' => $validated['frecuencia_cardiaca'] ?? null,
                    'temperatura' => $validated['temperatura'] ?? null,
                    'peso_kg' => $validated['peso_kg'] ?? null,
                    'talla_cm' => $validated['talla_cm'] ?? null,
                    'imc' => $imc,
                    'spo2' => $validated['spo2'] ?? null,
                    'diagnostico_cie10_codigo' => $validated['diagnostico_cie10_codigo'] ?? null,
                    'diagnostico_cie10_nombre' => $validated['diagnostico_cie10_nombre'] ?? null,
                    'observaciones_diagnostico' => $validated['observaciones_diagnostico'] ?? null,
                    'conclusion' => $validated['conclusion'] ?? null,
                    'plan_tratamiento' => $validated['plan_tratamiento'] ?? null,
                    'observaciones_adicionales' => $validated['observaciones_adicionales'] ?? null,
                    'estado' => 'finalizada',
                    'finalizada_at' => now(),
                ]
            );

            // Guardar lista de diagnósticos CIE-10 (múltiples)
            if (!empty($validated['diagnosticos_cie10_lista']) && count($validated['diagnosticos_cie10_lista']) > 0) {
                $consulta->diagnosticosCie10()->delete();
                foreach ($validated['diagnosticos_cie10_lista'] as $dItem) {
                    \App\Models\ConsultaDiagnosticoCie10::create([
                        'consulta_id' => $consulta->id,
                        'codigo' => strtoupper(trim($dItem['codigo'])),
                        'nombre' => trim($dItem['nombre']),
                        'tipo' => $dItem['tipo'] ?? 'principal',
                        'observaciones' => $dItem['observaciones'] ?? null,
                    ]);
                }

                // Sincronizar el diagnóstico principal en las columnas individuales para compatibilidad
                $primerDiag = $validated['diagnosticos_cie10_lista'][0];
                $consulta->update([
                    'diagnostico_cie10_codigo' => strtoupper(trim($primerDiag['codigo'])),
                    'diagnostico_cie10_nombre' => trim($primerDiag['nombre']),
                ]);
            }


            // Crear o actualizar orden de Receta Médica
            if (!empty($validated['medicamentos']) && count($validated['medicamentos']) > 0) {
                $receta = RecetaMedica::updateOrCreate(
                    ['consulta_id' => $consulta->id],
                    [
                        'paciente_id' => $cita->paciente_id,
                        'medico_id' => $cita->medico_id,
                        'indicaciones_generales' => $validated['indicaciones_generales'] ?? null,
                        'vigencia_dias' => 30,
                    ]
                );

                $receta->medicamentos()->delete();
                foreach ($validated['medicamentos'] as $med) {
                    RecetaMedicamento::create([
                        'receta_id' => $receta->id,
                        'medicamento_nombre' => $med['medicamento_nombre'],
                        'dosis' => $med['dosis'] ?? '1 comprimido',
                        'via_administracion' => $med['via_administracion'] ?? 'Oral',
                        'frecuencia' => $med['frecuencia'] ?? 'Cada 8 horas',
                        'duracion_dias' => $med['duracion_dias'] ?? 7,
                        'instrucciones' => $med['instrucciones'] ?? null,
                    ]);
                }
            }

            // Crear o actualizar orden de Estudios Solicitados (Laboratorios e Imágenes)
            if (!empty($validated['estudios_solicitados']) && count($validated['estudios_solicitados']) > 0) {
                $ordenEstudio = \App\Models\OrdenEstudio::updateOrCreate(
                    ['consulta_id' => $consulta->id],
                    [
                        'paciente_id' => $cita->paciente_id,
                        'medico_id' => $cita->medico_id,
                        'indicaciones_generales' => $validated['indicaciones_estudios'] ?? null,
                        'status' => true,
                    ]
                );

                $ordenEstudio->estudios()->delete();
                foreach ($validated['estudios_solicitados'] as $est) {
                    \App\Models\OrdenEstudioItem::create([
                        'orden_estudio_id' => $ordenEstudio->id,
                        'tipo_estudio' => $est['tipo_estudio'] ?? 'Laboratorio',
                        'nombre_estudio' => $est['nombre_estudio'],
                        'indicaciones' => $est['indicaciones'] ?? null,
                    ]);
                }
            }

            // Crear o actualizar Certificado de Reposo Médico
            if (isset($validated['tiene_reposo']) && $validated['tiene_reposo']) {
                \App\Models\ConsultaReposo::updateOrCreate(
                    ['consulta_id' => $consulta->id],
                    [
                        'empresa_id' => $cita->empresa_id,
                        'paciente_id' => $cita->paciente_id,
                        'medico_id' => $cita->medico_id,
                        'tiene_reposo' => true,
                        'tipo_reposo' => $validated['tipo_reposo'] ?? 'relativo',
                        'dias_reposo' => $validated['dias_reposo'] ?? 1,
                        'fecha_inicio' => $validated['fecha_inicio_reposo'] ?? now()->toDateString(),
                        'fecha_fin' => $validated['fecha_fin_reposo'] ?? now()->toDateString(),
                        'motivo_reposo' => $validated['motivo_reposo'] ?? null,
                        'observaciones' => $validated['observaciones_reposo'] ?? null,
                    ]
                );
            } else {
                \App\Models\ConsultaReposo::where('consulta_id', $consulta->id)->delete();
            }

            $cita->update(['estado' => 'atendida']);

            return redirect()->route('admin.consultas.finalizadas')->with('success', '¡Consulta médica finalizada con éxito! Receta, Orden de Estudios y Reposo procesados.');
        });
    }

    /**
     * Imprimir Informe Médico completo en formato PDF / HTML.
     */
    public function imprimirInforme(ConsultaMedica $consulta)
    {
        $consulta->load([
            'cita.paciente',
            'cita.medico',
            'cita.especialidad',
            'diagnosticosCie10',
            'receta.medicamentos',
            'ordenEstudio.estudios',
        ]);

        $empresa = auth()->user()->empresa ?? \App\Models\Empresa::find($consulta->empresa_id) ?? \App\Models\Empresa::first();
        $paciente = $consulta->cita->paciente;
        $medico = $consulta->cita->medico;
        $especialidad = $consulta->cita->especialidad;

        $edadPaciente = $paciente && $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : 'N/A';

        $tas = '120';
        $tad = '80';
        if (!empty($consulta->presion_arterial) && str_contains($consulta->presion_arterial, '/')) {
            $parts = explode('/', $consulta->presion_arterial);
            $tas = trim($parts[0]);
            $tad = trim($parts[1]);
        }

        $imcCalculado = '0.0';
        if ($consulta->peso_kg > 0 && $consulta->talla_cm > 0) {
            $tallaMetros = $consulta->talla_cm / 100;
            $imcCalculado = number_format($consulta->peso_kg / ($tallaMetros * $tallaMetros), 2);
        }

        $data = [
            'consulta' => $consulta,
            'empresa' => $empresa,
            'paciente' => $paciente,
            'medico' => $medico,
            'especialidad' => $especialidad,
            'edadPaciente' => $edadPaciente,
            'tas' => $tas,
            'tad' => $tad,
            'imcCalculado' => $imcCalculado,
            'diagnosticosCie10' => $consulta->diagnosticosCie10,
            'medicamentos' => $consulta->receta ? $consulta->receta->medicamentos : collect(),
            'estudios' => $consulta->ordenEstudio ? $consulta->ordenEstudio->estudios : collect(),
        ];

        if (request()->has('format') && request()->format === 'html') {
            return view('admin.consultas.impresion.informe', $data);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.consultas.impresion.informe', $data);
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream("Informe_Medico_Consulta_{$consulta->id}.pdf");
    }

    /**
     * Imprimir Receta Médica en formato PDF / HTML.
     */
    public function imprimirReceta(ConsultaMedica $consulta)
    {
        $consulta->load([
            'cita.paciente',
            'cita.medico',
            'cita.especialidad',
            'receta.medicamentos',
        ]);

        $empresa = auth()->user()->empresa ?? \App\Models\Empresa::find($consulta->empresa_id) ?? \App\Models\Empresa::first();
        $paciente = $consulta->cita->paciente;
        $medico = $consulta->cita->medico;
        $especialidad = $consulta->cita->especialidad;

        $edadPaciente = $paciente && $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : 'N/A';

        $data = [
            'consulta' => $consulta,
            'empresa' => $empresa,
            'paciente' => $paciente,
            'medico' => $medico,
            'especialidad' => $especialidad,
            'edadPaciente' => $edadPaciente,
            'medicamentos' => $consulta->receta ? $consulta->receta->medicamentos : collect(),
        ];

        if (request()->has('format') && request()->format === 'html') {
            return view('admin.consultas.impresion.receta', $data);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.consultas.impresion.receta', $data);
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream("Receta_Medica_Consulta_{$consulta->id}.pdf");
    }

    /**
     * Imprimir Orden de Estudios Paraclínicos en formato PDF / HTML.
     */
    public function imprimirEstudios(ConsultaMedica $consulta)
    {
        $consulta->load([
            'cita.paciente',
            'cita.medico',
            'cita.especialidad',
            'diagnosticosCie10',
            'ordenEstudio.estudios',
        ]);

        $empresa = auth()->user()->empresa ?? \App\Models\Empresa::find($consulta->empresa_id) ?? \App\Models\Empresa::first();
        $paciente = $consulta->cita->paciente;
        $medico = $consulta->cita->medico;
        $especialidad = $consulta->cita->especialidad;

        $edadPaciente = $paciente && $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : 'N/A';

        $data = [
            'consulta' => $consulta,
            'empresa' => $empresa,
            'paciente' => $paciente,
            'medico' => $medico,
            'especialidad' => $especialidad,
            'edadPaciente' => $edadPaciente,
            'diagnosticosCie10' => $consulta->diagnosticosCie10,
            'estudios' => $consulta->ordenEstudio ? $consulta->ordenEstudio->estudios : collect(),
        ];

        if (request()->has('format') && request()->format === 'html') {
            return view('admin.consultas.impresion.estudios', $data);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.consultas.impresion.estudios', $data);
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream("Orden_Estudios_Consulta_{$consulta->id}.pdf");
    }

    /**
     * Imprimir Certificado de Reposo Médico en formato PDF / HTML.
     */
    public function imprimirReposo(ConsultaMedica $consulta)
    {
        $consulta->load([
            'cita.paciente',
            'cita.medico',
            'cita.especialidad',
            'diagnosticosCie10',
            'reposo',
        ]);

        $empresa = auth()->user()->empresa ?? \App\Models\Empresa::find($consulta->empresa_id) ?? \App\Models\Empresa::first();
        $paciente = $consulta->cita->paciente;
        $medico = $consulta->cita->medico;
        $especialidad = $consulta->cita->especialidad;

        $edadPaciente = $paciente && $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : 'N/A';

        $data = [
            'consulta' => $consulta,
            'empresa' => $empresa,
            'paciente' => $paciente,
            'medico' => $medico,
            'especialidad' => $especialidad,
            'edadPaciente' => $edadPaciente,
            'diagnosticosCie10' => $consulta->diagnosticosCie10,
            'reposo' => $consulta->reposo,
        ];

        if (request()->has('format') && request()->format === 'html') {
            return view('admin.consultas.impresion.reposo', $data);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.consultas.impresion.reposo', $data);
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream("Certificado_Reposo_Consulta_{$consulta->id}.pdf");
    }

    /**
     * Imprimir Constancia de Asistencia Médica en formato PDF / HTML.
     */
    public function imprimirConstancia(ConsultaMedica $consulta, Request $request)
    {
        $consulta->load([
            'cita.paciente',
            'cita.medico',
            'cita.especialidad',
        ]);

        $empresa = auth()->user()->empresa ?? \App\Models\Empresa::find($consulta->empresa_id) ?? \App\Models\Empresa::first();
        $paciente = $consulta->cita->paciente;
        $medico = $consulta->cita->medico;
        $especialidad = $consulta->cita->especialidad;

        $edadPaciente = $paciente && $paciente->fecha_nacimiento
            ? \Carbon\Carbon::parse($paciente->fecha_nacimiento)->age
            : 'N/A';

        $motivoConstancia = $request->input('motivo', 'Consulta médica');
        $incluirAcompanante = filter_var($request->input('incluir_acompanante', false), FILTER_VALIDATE_BOOLEAN);
        $nombreAcompanante = trim($request->input('nombre_acompanante', ''));
        $cedulaAcompanante = trim($request->input('cedula_acompanante', ''));
        $relacionAcompanante = trim($request->input('relacion_acompanante', ''));

        $data = [
            'consulta' => $consulta,
            'empresa' => $empresa,
            'paciente' => $paciente,
            'medico' => $medico,
            'especialidad' => $especialidad,
            'edadPaciente' => $edadPaciente,
            'motivoConstancia' => $motivoConstancia,
            'incluirAcompanante' => $incluirAcompanante,
            'nombreAcompanante' => $nombreAcompanante,
            'cedulaAcompanante' => $cedulaAcompanante,
            'relacionAcompanante' => $relacionAcompanante,
        ];

        if ($request->has('format') && $request->format === 'html') {
            return view('admin.consultas.impresion.constancia', $data);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('admin.consultas.impresion.constancia', $data);
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream("Constancia_Asistencia_Consulta_{$consulta->id}.pdf");
    }
}

