<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AsistenciaMarcaje;
use App\Models\AsistenciaResumenDiario;
use App\Models\AsistenciaResumenSemanal;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Services\CalculoAsistenciaLftService;
use App\Services\RegionalConfigurationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AsistenciaReporteController extends Controller
{
    /**
     * Muestra la bitácora general de marcajes del reloj checador.
     */
    public function bitacoraMarcajes(Request $request)
    {
        $user = $request->user();
        if ($user && $user->empresa) {
            RegionalConfigurationService::setRegionalConfiguration($user->empresa);
        }

        $empresaId = $user->empresa_id;
        $sucursalId = $request->sucursal_id;
        $responsableId = $request->responsable_id;

        // Base query para calcular estadísticas globales
        $statsQuery = AsistenciaMarcaje::when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn ($q, $s) => $q->where('sucursal_id', $s))
            ->when($request->search, function ($q, $search) {
                $q->whereHas('empleado', function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%");
                });
            })
            ->when($responsableId, function ($q, $respId) {
                $q->whereHas('empleado', fn ($sub) => $sub->where('responsable_id', $respId));
            })
            ->when($request->tipo_marcaje, fn ($q, $t) => $q->where('tipo_marcaje', $t))
            ->when($request->origen, fn ($q, $o) => $q->where('origen', $o))
            ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('fecha_hora', '>=', $f))
            ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('fecha_hora', '<=', $f));

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'entradas' => (clone $statsQuery)->where('tipo_marcaje', 'entrada')->count(),
            'descansos' => (clone $statsQuery)->whereIn('tipo_marcaje', ['salida_comida', 'entrada_comida', 'descanso_inicio', 'descanso_fin'])->count(),
            'salidas' => (clone $statsQuery)->where('tipo_marcaje', 'salida')->count(),
        ];

        // Obtener empleados agrupados que tienen marcajes en el filtro
        $empleadosQuery = Empleado::with(['departamento', 'cargo', 'turnoLaboral', 'responsable', 'sucursal'])
            ->whereHas('marcajes', function ($q) use ($empresaId, $sucursalId, $request) {
                $q->when($empresaId, fn ($sub) => $sub->where('empresa_id', $empresaId))
                  ->when($sucursalId, fn ($sub, $s) => $sub->where('sucursal_id', $s))
                  ->when($request->tipo_marcaje, fn ($sub, $t) => $sub->where('tipo_marcaje', $t))
                  ->when($request->origen, fn ($sub, $o) => $sub->where('origen', $o))
                  ->when($request->fecha_inicio, fn ($sub, $f) => $sub->whereDate('fecha_hora', '>=', $f))
                  ->when($request->fecha_fin, fn ($sub, $f) => $sub->whereDate('fecha_hora', '<=', $f));
            })
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn ($q, $s) => $q->where('sucursal_id', $s))
            ->when($responsableId, fn ($q, $r) => $q->where('responsable_id', $r))
            ->when($request->search, function ($q, $search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('nombres', 'like', "%{$search}%")
                        ->orWhere('apellidos', 'like', "%{$search}%")
                        ->orWhere('documento_identidad', 'like', "%{$search}%");
                });
            });

        $empleadosPaginados = $empleadosQuery->paginate($request->perPage ?? 15)->withQueryString();

        $now = Carbon::now();
        $configAsistencia = \App\Models\ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();
        $minutosLeySilla = $configAsistencia?->ley_silla_descanso_minutos ?? 15;
        $intervaloHorasLeySilla = (float) ($configAsistencia?->ley_silla_intervalo_horas ?? 2.00);
        $intervaloMinutosLeySilla = (int) round($intervaloHorasLeySilla * 60);

        $empleadosPaginados->getCollection()->transform(function ($emp) use ($now, $minutosLeySilla, $intervaloHorasLeySilla, $intervaloMinutosLeySilla, $request, $empresaId) {
            // Cargar historial de marcajes de este empleado ordenados cronológicamente
            $historialMarcajes = AsistenciaMarcaje::with('sucursal')
                ->where('empleado_id', $emp->id)
                ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
                ->when($request->tipo_marcaje, fn ($q, $t) => $q->where('tipo_marcaje', $t))
                ->when($request->origen, fn ($q, $o) => $q->where('origen', $o))
                ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('fecha_hora', '>=', $f))
                ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('fecha_hora', '<=', $f))
                ->latest('fecha_hora')
                ->get()
                ->map(function ($m) {
                    $m->fecha_hora_iso = Carbon::parse($m->fecha_hora)->toIso8601String();
                    return $m;
                });

            $ultimoMarcaje = $historialMarcajes->first();

            $tiempoRestanteInfo = null;
            if ($ultimoMarcaje) {
                $esAlmuerzo = $ultimoMarcaje->tipo_marcaje === 'salida_comida';
                $esDescanso = $ultimoMarcaje->tipo_marcaje === 'descanso_inicio';
                $esSalida = $ultimoMarcaje->tipo_marcaje === 'salida';

                if ($esAlmuerzo || $esDescanso) {
                    $nombreConcepto = $esAlmuerzo ? 'Almuerzo' : 'Descanso';
                    $limiteMinutos = $esAlmuerzo 
                        ? ($emp->turnoLaboral?->minutos_descanso ?? 60)
                        : $minutosLeySilla;

                    $tiposRegreso = $esAlmuerzo 
                        ? ['entrada_comida', 'descanso_fin', 'salida', 'entrada_extraordinaria']
                        : ['descanso_fin', 'entrada_comida', 'salida', 'entrada_extraordinaria'];

                    $regreso = AsistenciaMarcaje::where('empleado_id', $emp->id)
                        ->where('fecha_hora', '>', $ultimoMarcaje->fecha_hora)
                        ->whereDate('fecha_hora', Carbon::parse($ultimoMarcaje->fecha_hora)->toDateString())
                        ->whereIn('tipo_marcaje', $tiposRegreso)
                        ->orderBy('fecha_hora', 'asc')
                        ->first();

                    if ($regreso) {
                        $duracion = (int) round(Carbon::parse($ultimoMarcaje->fecha_hora)->diffInMinutes(Carbon::parse($regreso->fecha_hora)));
                        $tiempoRestanteInfo = [
                            'estado' => 'completado',
                            'concepto' => $nombreConcepto,
                            'texto' => "Duración: {$duracion} min",
                            'subtexto' => "Límite {$nombreConcepto}: {$limiteMinutos} min",
                            'minutos_restantes' => 0,
                            'limite_minutos' => $limiteMinutos,
                            'duracion_real' => $duracion,
                        ];
                    } else {
                        $transcurridos = (int) round(Carbon::parse($ultimoMarcaje->fecha_hora)->diffInMinutes($now));
                        $restantes = $limiteMinutos - $transcurridos;

                        if ($restantes > 0) {
                            $tiempoRestanteInfo = [
                                'estado' => 'en_curso',
                                'concepto' => $nombreConcepto,
                                'texto' => "{$restantes} min restantes",
                                'subtexto' => "{$nombreConcepto}: {$limiteMinutos} min permitidos",
                                'minutos_restantes' => $restantes,
                                'limite_minutos' => $limiteMinutos,
                                'transcurridos' => $transcurridos,
                            ];
                        } else {
                            $exceso = abs($restantes);
                            $tiempoRestanteInfo = [
                                'estado' => 'excedido',
                                'concepto' => $nombreConcepto,
                                'texto' => "Excedido por {$exceso} min",
                                'subtexto' => "Límite {$nombreConcepto}: {$limiteMinutos} min",
                                'minutos_restantes' => $restantes,
                                'limite_minutos' => $limiteMinutos,
                                'transcurridos' => $transcurridos,
                            ];
                        }
                    }
                } elseif ($esSalida) {
                    $tiempoRestanteInfo = [
                        'estado' => 'completado',
                        'concepto' => 'Jornada',
                        'texto' => 'Jornada Finalizada',
                        'subtexto' => 'Marcaje de salida registrado',
                        'minutos_restantes' => 0,
                        'limite_minutos' => 0,
                    ];
                } else {
                    // El empleado está laborando (entrada, descanso_fin, entrada_comida, entrada_extraordinaria)
                    // Se calcula el conteo regresivo hasta el próximo llamado a descanso según el intervalo configurado
                    $transcurridos = (int) round(Carbon::parse($ultimoMarcaje->fecha_hora)->diffInMinutes($now));
                    $restantes = $intervaloMinutosLeySilla - $transcurridos;
                    $intervaloFormatted = number_format($intervaloHorasLeySilla, 2);

                    if ($restantes > 0) {
                        $tiempoRestanteInfo = [
                            'estado' => 'en_curso',
                            'concepto' => 'Próximo Descanso',
                            'texto' => "{$restantes} min para descanso",
                            'subtexto' => "Próximo descanso (Cada {$intervaloFormatted}h continuas)",
                            'minutos_restantes' => $restantes,
                            'limite_minutos' => $intervaloMinutosLeySilla,
                            'transcurridos' => $transcurridos,
                        ];
                    } else {
                        $exceso = abs($restantes);
                        $tiempoRestanteInfo = [
                            'estado' => 'excedido',
                            'concepto' => 'Próximo Descanso',
                            'texto' => "Llamado a descanso pendiente ({$exceso} min)",
                            'subtexto' => "Superado intervalo de {$intervaloFormatted}h continuas",
                            'minutos_restantes' => $restantes,
                            'limite_minutos' => $intervaloMinutosLeySilla,
                            'transcurridos' => $transcurridos,
                        ];
                    }
                }
            }

            $emp->ultimo_marcaje = $ultimoMarcaje;
            $emp->tiempo_restante_info = $tiempoRestanteInfo;
            $emp->historial_marcajes = $historialMarcajes;
            $emp->conteo_eventos = [
                'total' => $historialMarcajes->count(),
                'entradas' => $historialMarcajes->where('tipo_marcaje', 'entrada')->count(),
                'descansos' => $historialMarcajes->whereIn('tipo_marcaje', ['salida_comida', 'entrada_comida', 'descanso_inicio', 'descanso_fin'])->count(),
                'salidas' => $historialMarcajes->where('tipo_marcaje', 'salida')->count(),
            ];

            return $emp;
        });

        $sucursales = Sucursal::where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'zona_horaria']);

        $responsables = Responsable::where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombres', 'asc')
            ->get(['id', 'nombres', 'apellidos']);

        return Inertia::render('admin/asistencia/Bitacora', [
            'marcajes' => $empleadosPaginados,
            'stats' => $stats,
            'sucursales' => $sucursales,
            'responsables' => $responsables,
            'filters' => $request->only('search', 'tipo_marcaje', 'origen', 'fecha_inicio', 'fecha_fin', 'sucursal_id', 'responsable_id', 'perPage'),
        ]);
    }

    /**
     * Generación y exportación de reportes de marcajes en formato Excel (.xlsx) o CSV.
     */
    public function exportarMarcajes(Request $request)
    {
        $user = $request->user();
        if ($user && $user->empresa) {
            RegionalConfigurationService::setRegionalConfiguration($user->empresa);
        }

        $empresaId = $user ? $user->empresa_id : null;
        $sucursalId = $request->sucursal_id;
        $responsableId = $request->responsable_id;
        $formato = strtolower($request->input('formato', 'excel'));

        $query = AsistenciaMarcaje::with([
            'empleado.departamento',
            'empleado.cargo',
            'empleado.responsable',
            'sucursal'
        ])
        ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
        ->when($sucursalId, fn ($q, $s) => $q->where('sucursal_id', $s))
        ->when($request->tipo_marcaje, fn ($q, $t) => $q->where('tipo_marcaje', $t))
        ->when($request->origen, fn ($q, $o) => $q->where('origen', $o))
        ->when($request->fecha_inicio, fn ($q, $f) => $q->whereDate('fecha_hora', '>=', $f))
        ->when($request->fecha_fin, fn ($q, $f) => $q->whereDate('fecha_hora', '<=', $f))
        ->when($request->search, function ($q, $search) {
            $q->whereHas('empleado', function ($sub) use ($search) {
                $sub->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('documento_identidad', 'like', "%{$search}%");
            });
        })
        ->when($responsableId, function ($q, $r) {
            $q->whereHas('empleado', fn ($sub) => $sub->where('responsable_id', $r));
        })
        ->orderBy('fecha_hora', 'desc');

        $tiposLabels = [
            'entrada' => 'Entrada',
            'salida_comida' => 'Salida a Comer',
            'entrada_comida' => 'Regreso de Comer',
            'salida' => 'Salida Final',
            'descanso_inicio' => 'Inicio de Descanso',
            'descanso_fin' => 'Fin de Descanso',
            'incidente_inicio' => 'Incidente / Pausa',
            'incidente_fin' => 'Fin de Incidente',
            'entrada_extraordinaria' => 'Entrada Extraordinaria',
        ];

        // Exportación en CSV
        if ($formato === 'csv') {
            $response = new StreamedResponse(function () use ($query, $tiposLabels) {
                $handle = fopen('php://output', 'w');
                // UTF-8 BOM para compatibilidad con Excel en español
                fwrite($handle, "\xEF\xBB\xBF");

                fputcsv($handle, [
                    'ID',
                    'Fecha y Hora Local',
                    'Zona Horaria',
                    'No. Empleado / DNI',
                    'Nombre Completo',
                    'Departamento',
                    'Puesto / Cargo',
                    'Sede / Sucursal',
                    'Responsable Directo',
                    'Tipo de Evento',
                    'Origen',
                    'Latitud',
                    'Longitud',
                    'Enlace Google Maps',
                    'Observaciones / Causa',
                ]);

                $query->chunk(500, function ($marcajes) use ($handle, $tiposLabels) {
                    foreach ($marcajes as $m) {
                        $tz = $m->sucursal?->zona_horaria ?? 'America/Mexico_City';
                        $fechaLocal = Carbon::parse($m->fecha_hora)->timezone($tz)->format('Y-m-d H:i:s');
                        $mapsUrl = ($m->latitud && $m->longitud) ? "https://www.google.com/maps?q={$m->latitud},{$m->longitud}" : '';
                        $responsableNombre = $m->empleado?->responsable 
                            ? "{$m->empleado->responsable->nombres} {$m->empleado->responsable->apellidos}" 
                            : 'Sin asignar';

                        fputcsv($handle, [
                            $m->id,
                            $fechaLocal,
                            $tz,
                            $m->empleado?->documento_identidad ?? '',
                            $m->empleado?->nombre_completo ?? '',
                            $m->empleado?->departamento?->nombre ?? 'General',
                            $m->empleado?->cargo?->nombre ?? 'N/A',
                            $m->sucursal?->nombre ?? 'General',
                            $responsableNombre,
                            $tiposLabels[$m->tipo_marcaje] ?? ucfirst($m->tipo_marcaje),
                            ucfirst($m->origen ?? 'N/A'),
                            $m->latitud ?? '',
                            $m->longitud ?? '',
                            $mapsUrl,
                            $m->observaciones ?? $m->incidente_causa ?? '',
                        ]);
                    }
                });

                fclose($handle);
            }, 200, [
                'Content-Type' => 'text/csv; charset=UTF-8',
                'Content-Disposition' => 'attachment; filename="marcajes_' . date('Y-m-d_His') . '.csv"',
            ]);

            return $response;
        }

        // Exportación en Excel (.xlsx con PhpSpreadsheet)
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Marcajes Laborales');

        $headers = [
            'A1' => 'ID',
            'B1' => 'Fecha y Hora Local',
            'C1' => 'Zona Horaria',
            'D1' => 'No. Empleado',
            'E1' => 'Nombre Completo',
            'F1' => 'Departamento',
            'G1' => 'Puesto / Cargo',
            'H1' => 'Sede / Sucursal',
            'I1' => 'Responsable Directo',
            'J1' => 'Tipo de Evento',
            'K1' => 'Origen',
            'L1' => 'Latitud',
            'M1' => 'Longitud',
            'N1' => 'Google Maps',
            'O1' => 'Observaciones / Causa',
        ];

        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1E293B'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $row = 2;
        $marcajes = $query->limit(10000)->get();

        foreach ($marcajes as $m) {
            $tz = $m->sucursal?->zona_horaria ?? 'America/Mexico_City';
            $fechaLocal = Carbon::parse($m->fecha_hora)->timezone($tz)->format('Y-m-d H:i:s');
            $mapsUrl = ($m->latitud && $m->longitud) ? "https://www.google.com/maps?q={$m->latitud},{$m->longitud}" : '';
            $responsableNombre = $m->empleado?->responsable 
                ? "{$m->empleado->responsable->nombres} {$m->empleado->responsable->apellidos}" 
                : 'Sin asignar';

            $sheet->setCellValue("A{$row}", $m->id);
            $sheet->setCellValue("B{$row}", $fechaLocal);
            $sheet->setCellValue("C{$row}", $tz);
            $sheet->setCellValue("D{$row}", $m->empleado?->documento_identidad ?? '');
            $sheet->setCellValue("E{$row}", $m->empleado?->nombre_completo ?? '');
            $sheet->setCellValue("F{$row}", $m->empleado?->departamento?->nombre ?? 'General');
            $sheet->setCellValue("G{$row}", $m->empleado?->cargo?->nombre ?? 'N/A');
            $sheet->setCellValue("H{$row}", $m->sucursal?->nombre ?? 'General');
            $sheet->setCellValue("I{$row}", $responsableNombre);
            $sheet->setCellValue("J{$row}", $tiposLabels[$m->tipo_marcaje] ?? ucfirst($m->tipo_marcaje));
            $sheet->setCellValue("K{$row}", ucfirst($m->origen ?? 'N/A'));
            $sheet->setCellValue("L{$row}", $m->latitud ?? '');
            $sheet->setCellValue("M{$row}", $m->longitud ?? '');

            if ($mapsUrl) {
                $sheet->setCellValue("N{$row}", 'Ver Mapa');
                $sheet->getCell("N{$row}")->getHyperlink()->setUrl($mapsUrl);
                $sheet->getStyle("N{$row}")->getFont()->getColor()->setRGB('2563EB');
                $sheet->getStyle("N{$row}")->getFont()->setUnderline(true);
            } else {
                $sheet->setCellValue("N{$row}", 'N/A');
            }

            $sheet->setCellValue("O{$row}", $m->observaciones ?? $m->incidente_causa ?? '');

            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:O{$row}")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('F8FAFC');
            }

            $row++;
        }

        $lastRow = max($row - 1, 1);
        $sheet->getStyle("A1:O{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN)->getColor()->setRGB('E2E8F0');

        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'marcajes_' . date('Y-m-d_His') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    /**
     * Muestra el Panel de Control de Asistencia en Tiempo Real segmentado por Sede y Responsable.
     */
    public function panelControl(Request $request)
    {
        $user = $request->user();
        if ($user && $user->empresa) {
            RegionalConfigurationService::setRegionalConfiguration($user->empresa);
        }

        $empresaId = $user ? $user->empresa_id : null;
        $sucursalId = $request->input('sucursal_id');
        $responsableId = $request->input('responsable_id');
        $fecha = $request->input('fecha', Carbon::today()->toDateString());

        // Catálogos para filtros
        $sucursales = Sucursal::where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombre', 'asc')
            ->get(['id', 'nombre', 'zona_horaria', 'ciudad', 'estado']);

        $responsables = Responsable::where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->orderBy('nombres', 'asc')
            ->get(['id', 'nombres', 'apellidos']);

        $configAsistencia = ConfiguracionAsistencia::where('empresa_id', $empresaId)->first();
        $toleranciaGlobal = (int)($configAsistencia?->tolerancia_retardo_minutos ?? 10);

        // Plantilla de colaboradores
        $empleados = Empleado::with([
            'departamento:id,nombre',
            'cargo:id,nombre',
            'responsable:id,nombres,apellidos',
            'sucursal:id,nombre,zona_horaria',
            'turnoLaboral:id,nombre,hora_entrada,hora_salida'
        ])
        ->where('status', true)
        ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
        ->when($sucursalId, fn ($q) => $q->where('sucursal_id', $sucursalId))
        ->when($responsableId, fn ($q) => $q->where('responsable_id', $responsableId))
        ->when($request->search, function ($q, $search) {
            $q->where(function ($sub) use ($search) {
                $sub->where('nombres', 'like', "%{$search}%")
                    ->orWhere('apellidos', 'like', "%{$search}%")
                    ->orWhere('documento_identidad', 'like', "%{$search}%");
            });
        })
        ->orderBy('nombres', 'asc')
        ->get();

        $empleadosIds = $empleados->pluck('id');
        $marcajesDelDia = AsistenciaMarcaje::whereIn('empleado_id', $empleadosIds)
            ->whereDate('fecha_hora', $fecha)
            ->orderBy('fecha_hora', 'asc')
            ->get()
            ->groupBy('empleado_id');

        $plantillaStatus = $empleados->map(function ($emp) use ($marcajesDelDia, $fecha, $toleranciaGlobal) {
            $marcajes = $marcajesDelDia->get($emp->id, collect());
            $tz = $emp->sucursal?->zona_horaria ?? 'America/Mexico_City';

            $primerMarcaje = $marcajes->first();
            $ultimoMarcaje = $marcajes->last();

            $status = 'ausente'; // 'presente' | 'en_comida' | 'en_descanso' | 'salida' | 'ausente'
            if ($ultimoMarcaje) {
                switch ($ultimoMarcaje->tipo_marcaje) {
                    case 'entrada':
                    case 'entrada_comida':
                    case 'descanso_fin':
                    case 'entrada_extraordinaria':
                        $status = 'presente';
                        break;
                    case 'salida_comida':
                        $status = 'en_comida';
                        break;
                    case 'descanso_inicio':
                        $status = 'en_descanso';
                        break;
                    case 'salida':
                        $status = 'salida';
                        break;
                    default:
                        $status = 'presente';
                }
            }

            // Detección de retardo respecto a hora de entrada de turno
            $esRetardo = false;
            $minutosRetardo = 0;
            if ($primerMarcaje && $primerMarcaje->tipo_marcaje === 'entrada' && $emp->turnoLaboral && $emp->turnoLaboral->hora_entrada) {
                $horaEntradaTurno = Carbon::parse($fecha . ' ' . $emp->turnoLaboral->hora_entrada, $tz);
                $horaEntradaConTolerancia = (clone $horaEntradaTurno)->addMinutes($toleranciaGlobal);

                $horaRealEntrada = Carbon::parse($primerMarcaje->fecha_hora)->timezone($tz);
                if ($horaRealEntrada->greaterThan($horaEntradaConTolerancia)) {
                    $esRetardo = true;
                    $minutosRetardo = $horaRealEntrada->diffInMinutes($horaEntradaTurno);
                }
            }

            $eventosHoy = $marcajes->map(function ($m) use ($tz) {
                return [
                    'id' => $m->id,
                    'tipo_marcaje' => $m->tipo_marcaje,
                    'fecha_hora' => $m->fecha_hora,
                    'hora' => Carbon::parse($m->fecha_hora)->timezone($tz)->format('H:i:s'),
                    'origen' => $m->origen,
                    'latitud' => $m->latitud,
                    'longitud' => $m->longitud,
                    'geolocalizacion' => $m->geolocalizacion,
                    'fotografia_path' => $m->fotografia_path,
                    'observaciones' => $m->observaciones ?? $m->incidente_causa,
                ];
            })->values()->all();

            $turnoHorario = null;
            if ($emp->turnoLaboral && $emp->turnoLaboral->hora_entrada && $emp->turnoLaboral->hora_salida) {
                $turnoHorario = substr($emp->turnoLaboral->hora_entrada, 0, 5) . ' - ' . substr($emp->turnoLaboral->hora_salida, 0, 5);
            }

            return [
                'id' => $emp->id,
                'nombres' => $emp->nombres,
                'apellidos' => $emp->apellidos,
                'nombre_completo' => $emp->nombre_completo,
                'documento_identidad' => $emp->documento_identidad,
                'foto_empleado' => $emp->foto_empleado,
                'departamento' => $emp->departamento?->nombre ?? 'N/A',
                'cargo' => $emp->cargo?->nombre ?? 'N/A',
                'responsable' => $emp->responsable ? ($emp->responsable->nombres . ' ' . $emp->responsable->apellidos) : 'Sin asignar',
                'responsable_id' => $emp->responsable_id,
                'sucursal' => $emp->sucursal?->nombre ?? 'General',
                'sucursal_id' => $emp->sucursal_id,
                'zona_horaria' => $tz,
                'turno' => $emp->turnoLaboral?->nombre ?? 'Sin turno asignado',
                'turno_horario' => $turnoHorario,
                'status_asistencia' => $status,
                'es_retardo' => $esRetardo,
                'minutos_retardo' => $minutosRetardo,
                'primer_ingreso' => $primerMarcaje ? Carbon::parse($primerMarcaje->fecha_hora)->timezone($tz)->format('H:i:s') : null,
                'ultimo_evento' => $ultimoMarcaje ? [
                    'tipo' => $ultimoMarcaje->tipo_marcaje,
                    'hora' => Carbon::parse($ultimoMarcaje->fecha_hora)->timezone($tz)->format('H:i:s'),
                    'origen' => $ultimoMarcaje->origen,
                    'latitud' => $ultimoMarcaje->latitud,
                    'longitud' => $ultimoMarcaje->longitud,
                    'geolocalizacion' => $ultimoMarcaje->geolocalizacion,
                ] : null,
                'eventos_hoy' => $eventosHoy,
                'total_marcajes_hoy' => $marcajes->count(),
            ];
        });

        // Métricas globales sobre el total de colaboradores filtrados por sede/supervisor/búsqueda
        $totalPlantilla = $plantillaStatus->count();
        $presentes = $plantillaStatus->where('status_asistencia', 'presente')->count();
        $enComida = $plantillaStatus->where('status_asistencia', 'en_comida')->count();
        $enDescanso = $plantillaStatus->where('status_asistencia', 'en_descanso')->count();
        $salidas = $plantillaStatus->where('status_asistencia', 'salida')->count();
        $retardos = $plantillaStatus->where('es_retardo', true)->count();
        $ausentes = $plantillaStatus->where('status_asistencia', 'ausente')->count();
        $activosTotales = $presentes + $enComida + $enDescanso + $salidas;
        $tasaAsistencia = $totalPlantilla > 0 ? round(($activosTotales / $totalPlantilla) * 100, 1) : 0;

        $kpis = [
            'total_plantilla' => $totalPlantilla,
            'presentes' => $presentes,
            'en_comida' => $enComida,
            'en_descanso' => $enDescanso,
            'salidas' => $salidas,
            'retardos' => $retardos,
            'ausentes' => $ausentes,
            'tasa_asistencia' => $tasaAsistencia,
        ];

        // Filtro por estatus operativo
        $statusAsistencia = $request->input('status_asistencia', 'todos');
        $filteredStatus = $plantillaStatus;
        if ($statusAsistencia && $statusAsistencia !== 'todos') {
            $filteredStatus = $plantillaStatus->filter(function ($item) use ($statusAsistencia) {
                return match ($statusAsistencia) {
                    'presente', 'presentes' => $item['status_asistencia'] === 'presente',
                    'pausa' => in_array($item['status_asistencia'], ['en_comida', 'en_descanso']),
                    'retardo', 'retardos' => $item['es_retardo'] === true,
                    'salida', 'salidas' => $item['status_asistencia'] === 'salida',
                    'ausente', 'ausentes' => $item['status_asistencia'] === 'ausente',
                    default => true,
                };
            })->values();
        }

        // Paginación estándar de Laravel compatible con DataTable
        $perPage = (int) $request->input('perPage', 15);
        $page = (int) $request->input('page', 1);
        $itemsForPage = $filteredStatus->slice(($page - 1) * $perPage, $perPage)->values();

        $paginated = new LengthAwarePaginator(
            $itemsForPage,
            $filteredStatus->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        return Inertia::render('admin/asistencia/PanelControl', [
            'colaboradores' => $paginated,
            'kpis' => $kpis,
            'sucursales' => $sucursales,
            'responsables' => $responsables,
            'filters' => [
                'sucursal_id' => $sucursalId ? (int)$sucursalId : null,
                'responsable_id' => $responsableId ? (int)$responsableId : null,
                'fecha' => $fecha,
                'search' => $request->search ?? '',
                'status_asistencia' => $statusAsistencia,
                'perPage' => $perPage,
            ],
        ]);
    }

    /**
     * Muestra la consola de Pre-Nómina y Cálculo de Horas a Pagar (LFT).
     */
    public function calculoNomina(Request $request, CalculoAsistenciaLftService $calculoService)
    {
        $user = $request->user();
        $empresaId = $user->empresa_id;

        $fechaInicio = $request->input('fecha_inicio', Carbon::now()->startOfWeek()->toDateString());
        $fechaFin = $request->input('fecha_fin', Carbon::now()->endOfWeek()->toDateString());

        // Obtener empleados activos
        $empleados = Empleado::with(['departamento', 'turnoLaboral'])
            ->where('status', true)
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->get();

        // Procesar resúmenes semanales para cada empleado en el período si es requerido
        if ($request->boolean('procesar')) {
            foreach ($empleados as $emp) {
                $calculoService->procesarResumenSemanal($emp, $fechaInicio, $fechaFin);
            }
        }

        // Cargar resúmenes semanales procesados y adjuntar semáforo
        $resumenesSemanales = AsistenciaResumenSemanal::with(['empleado.departamento', 'empleado.cargo', 'empleado.turnoLaboral'])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->where('periodo_inicio', '>=', $fechaInicio)
            ->where('periodo_fin', '<=', $fechaFin)
            ->get()
            ->map(function ($r) use ($calculoService) {
                $totalH = (float)($r->total_horas_ordinarias + $r->total_horas_extra_dobles + $r->total_horas_extra_triples);
                $r->semaforo = $calculoService->obtenerSemaforoSemanal($totalH);
                return $r;
            });

        // Tarjetas estadísticas consolidadas
        $stats = [
            'total_empleados' => $empleados->count(),
            'total_horas_ordinarias' => $resumenesSemanales->sum('total_horas_ordinarias'),
            'total_horas_dobles' => $resumenesSemanales->sum('total_horas_extra_dobles'),
            'total_horas_triples' => $resumenesSemanales->sum('total_horas_extra_triples'),
            'monto_total_nomina' => $resumenesSemanales->sum('monto_total_pagar'),
        ];

        return Inertia::render('admin/asistencia/CalculoNomina', [
            'resumenesSemanales' => $resumenesSemanales,
            'stats' => $stats,
            'filters' => [
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
            ],
        ]);
    }
}
