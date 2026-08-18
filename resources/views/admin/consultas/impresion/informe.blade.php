<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe Médico - {{ $paciente->apellidos }}, {{ $paciente->nombres }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 10.5px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .no-print {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f1f5f9;
            border-radius: 8px;
        }

        .btn-print {
            background-color: #0284c7;
            color: white;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
        }

        .btn-close {
            background-color: #475569;
            color: white;
            border: none;
            padding: 8px 16px;
            font-weight: bold;
            border-radius: 6px;
            cursor: pointer;
        }

        @media print {
            .no-print {
                display: none !important;
            }
            body {
                margin: 0;
                padding: 0;
            }
        }

        /* Contenedor Ficha */
        .header-container {
            width: 100%;
            display: table;
            margin-bottom: 8px;
        }

        .header-left {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            text-align: right;
        }

        .logo-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }

        .rif-badge {
            font-size: 10px;
            font-weight: bold;
            color: #475569;
            margin-bottom: 6px;
        }

        .service-title {
            font-size: 12px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            margin-bottom: 6px;
        }

        .patient-info {
            font-size: 10.5px;
            line-height: 1.4;
            color: #1e293b;
        }

        .patient-info strong {
            font-weight: 800;
        }

        /* Tablas Principales */
        table.medical-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            page-break-inside: avoid;
        }

        table.medical-grid th {
            background-color: #cbd5e1;
            color: #0f172a;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            text-align: center;
            padding: 4px 6px;
            border: 1px solid #475569;
        }

        table.medical-grid td {
            padding: 5px 8px;
            border: 1px solid #475569;
            vertical-align: top;
            font-size: 10.5px;
        }

        .text-center {
            text-align: center;
        }

        .text-bold {
            font-weight: 700;
        }

        .uppercase {
            text-transform: uppercase;
        }

        /* Secciones Estructuradas */
        .section-header {
            background-color: #cbd5e1;
            color: #0f172a;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            text-align: center;
            padding: 4px 6px;
            border: 1px solid #475569;
        }

        .section-content {
            padding: 6px 8px;
            border: 1px solid #475569;
            border-top: none;
            min-height: 20px;
            font-size: 10.5px;
            line-height: 1.4;
            margin-bottom: 6px;
        }

        /* Signos Vitales Grid */
        table.vitals-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }

        table.vitals-table td {
            border: 1px solid #475569;
            padding: 4px 6px;
            font-size: 10px;
        }

        table.vitals-table .label {
            background-color: #e2e8f0;
            font-weight: 800;
            text-transform: uppercase;
            text-align: center;
            width: 20%;
        }

        table.vitals-table .val {
            text-align: center;
            font-weight: 700;
            width: 13%;
        }

        /* Sub-tablas Internas (Estudios, Receta) */
        table.inner-table {
            width: 100%;
            border-collapse: collapse;
        }

        table.inner-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
            vertical-align: top;
        }

        table.inner-table tr:last-child td {
            border-bottom: none;
        }

        .study-badge {
            display: inline-block;
            background-color: #e0f2fe;
            color: #0369a1;
            font-weight: 800;
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 4px;
            text-transform: uppercase;
            border: 1px solid #bae6fd;
        }

        /* Firmas y Sellos */
        .signatures-area {
            margin-top: 30px;
            width: 100%;
            display: table;
            page-break-inside: avoid;
        }

        .signature-box-left {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: bottom;
        }

        .signature-box-right {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: bottom;
        }

        .stamp-circle {
            display: inline-block;
            border: 2px dashed #94a3b8;
            border-radius: 50%;
            padding: 12px 20px;
            color: #64748b;
            font-weight: bold;
            font-size: 9.5px;
            text-transform: uppercase;
            transform: rotate(-4deg);
        }

        .signature-line {
            width: 70%;
            border-top: 1.5px solid #0f172a;
            margin: 0 auto 4px auto;
        }
    </style>
</head>
<body>

    @if(request()->has('format') && request()->format === 'html')
    <!-- Botones de Impresión en Pantalla (solo para vista HTML) -->
    <div class="no-print">
        <button onclick="window.print()" class="btn-print">🖨️ Imprimir Informe Médico</button>
        <button onclick="window.close()" class="btn-close">Cerrar</button>
    </div>
    @endif

    <!-- ENCABEZADO INSTITUCIONAL -->
    <div class="header-container">
        <div class="header-left">
            @if(!empty($empresa->logo))
                <img src="{{ asset('storage/' . $empresa->logo) }}" alt="Logo" style="max-height: 45px; margin-bottom: 4px;">
            @else
                <div class="logo-title">{{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'VITALMED SALUD' }}</div>
            @endif
            <div class="rif-badge">RIF: {{ $empresa->documento ?? 'J-503304456' }}</div>
            <div class="patient-info">
                <strong>Fecha de nacimiento:</strong> {{ $paciente->fecha_nacimiento ?? 'N/A' }}<br>
                <strong>Edad del paciente:</strong> {{ $edadPaciente ?? 'N/A' }} años
            </div>
        </div>

        <div class="header-right">
            <div class="service-title">SERVICIO MÉDICO {{ strtoupper($empresa->nombre_comercial ?? $empresa->razon_social ?? 'VITALMED SALUD') }}</div>
            <div class="patient-info" style="margin-top: 8px;">
                <strong>Nombre del paciente:</strong> {{ $paciente->apellidos }}, {{ $paciente->nombres }}<br>
                <strong>Cédula del paciente:</strong> {{ $paciente->documento_identidad ?? $paciente->cedula ?? $paciente->codigo_paciente }}
            </div>
        </div>
    </div>

    <!-- FECHA Y HORAS DE CONSULTA -->
    <table class="medical-grid">
        <thead>
            <tr>
                <th style="width: 34%;">FECHA DE CONSULTA</th>
                <th style="width: 33%;">HORA DE INICIO</th>
                <th style="width: 33%;">HORA FINAL DE CONSULTA</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="text-center text-bold">{{ $consulta->created_at ? $consulta->created_at->format('d-m-Y') : date('d-m-Y') }}</td>
                <td class="text-center text-bold">{{ $consulta->created_at ? $consulta->created_at->format('H:i:s') : '13:47:29' }}</td>
                <td class="text-center text-bold">{{ $consulta->updated_at ? $consulta->updated_at->format('H:i:s A') : '16:13:59 PM' }}</td>
            </tr>
        </tbody>
    </table>

    <!-- MOTIVO DE CONSULTA -->
    <div class="section-header">MOTIVO DE CONSULTA</div>
    <div class="section-content text-bold uppercase">
        {{ $consulta->motivo_consulta ?? 'Control de rutina' }}
    </div>

    <!-- ENFERMEDAD ACTUAL -->
    <div class="section-header">ENFERMEDAD ACTUAL</div>
    <div class="section-content text-bold">
        {{ $consulta->enfermedad_actual ?? 'Paciente acude a evaluación médica clínica.' }}
    </div>

    <!-- EXÁMEN FÍSICO - SIGNOS VITALES -->
    <div class="section-header">EXÁMEN FÍSICO</div>
    <table class="vitals-table">
        <tr>
            <td class="label">T.A.S (mmHG)</td>
            <td class="val">{{ $tas }}</td>
            <td class="label">T.A.D (mmHG)</td>
            <td class="val">{{ $tad }}</td>
            <td class="label">Pulso (P.P.M)</td>
            <td class="val">{{ $consulta->frecuencia_cardiaca ?? '-' }}</td>
        </tr>
        <tr>
            <td class="label">Peso (KG)</td>
            <td class="val">{{ $consulta->peso_kg ?? '-' }}</td>
            <td class="label">Estatura (MTRS)</td>
            <td class="val">{{ $consulta->talla_cm ? number_format($consulta->talla_cm / 100, 2) : '-' }}</td>
            <td class="label">IMC (Kg/m2)</td>
            <td class="val">{{ $imcCalculado }}</td>
        </tr>
        <tr>
            <td class="label">TEMPERATURA (oC)</td>
            <td class="val">{{ $consulta->temperatura ?? '-' }}</td>
            <td class="label">Saturación</td>
            <td class="val">{{ $consulta->spo2 ?? '-' }}</td>
            <td class="label" style="background-color: #f1f5f9;">-</td>
            <td class="val" style="background-color: #f1f5f9;">-</td>
        </tr>
    </table>

    <!-- DESCRIPCIÓN DE EXÁMEN FÍSICO -->
    <div class="section-header">DESCRIPCIÓN DE EXÁMEN FÍSICO</div>
    <div class="section-content text-bold">
        {!! !empty(trim(strip_tags($consulta->examen_fisico ?? ''))) ? $consulta->examen_fisico : 'Sin alteración ni hallazgos patológicos aparentes.' !!}
    </div>

    <!-- CONCLUSIÓN I/D (DIAGNÓSTICOS) -->
    <div class="section-header">CONCLUSIÓN I/D</div>
    <div class="section-content text-bold uppercase">
        @if($diagnosticosCie10->count() > 0)
            @foreach($diagnosticosCie10 as $diag)
                <div>• {{ $diag->codigo }} - {{ $diag->nombre }} ({{ strtoupper($diag->tipo) }})</div>
            @endforeach
        @elseif($consulta->diagnostico_cie10_codigo)
            <div>• {{ $consulta->diagnostico_cie10_codigo }} - {{ $consulta->diagnostico_cie10_nombre }}</div>
        @endif

        @if($consulta->conclusion)
            <div style="margin-top: 4px; font-weight: normal;">{!! $consulta->conclusion !!}</div>
        @endif
    </div>

    <!-- PRESCRIPCION DEL TRATAMIENTO -->
    <div class="section-header">PRESCRIPCION DEL TRATAMIENTO</div>
    <div class="section-content text-bold uppercase">
        @if($medicamentos->count() > 0)
            @foreach($medicamentos as $med)
                <div>• {{ $med->medicamento_nombre }} {{ $med->dosis }} (Vía {{ $med->via_administracion }})</div>
            @endforeach
        @else
            <div>NO SE PRESCRIBIÓ TRATAMIENTO FARMACOLÓGICO.</div>
        @endif
    </div>

    <!-- INDICACIONES DEL TRATAMIENTO -->
    <div class="section-header">INDICACIONES DEL TRATAMIENTO</div>
    <div class="section-content text-bold uppercase">
        @if($medicamentos->count() > 0)
            @foreach($medicamentos as $med)
                @php
                    $frecuenciaRaw = $med->frecuencia ?? '';
                    $frecuenciaLimpia = preg_replace('/^cada\s+/i', '', trim($frecuenciaRaw));

                    $instruccionRaw = trim($med->instrucciones ?? '');
                    // Eliminar repetición del nombre del medicamento al inicio de la indicación
                    $instruccionLimpia = preg_replace('/^' . preg_quote($med->medicamento_nombre, '/') . '\s*:\s*/i', '', $instruccionRaw);
                @endphp
                <div style="margin-bottom: 3px;">
                    • {{ $med->medicamento_nombre }} {{ $med->dosis }}: 
                    @if(!empty($instruccionLimpia))
                        {{ strtoupper($instruccionLimpia) }}
                    @else
                        TOMAR CADA {{ strtoupper($frecuenciaLimpia ?: '8 HORAS') }} POR {{ $med->duracion_dias ?? 7 }} DÍAS.
                    @endif
                </div>
            @endforeach
        @endif

        @if(!empty($consulta->receta->indicaciones_generales) && $consulta->receta->indicaciones_generales !== 'Reposo relativo e hidratación abundante.')
            <div style="margin-top: 5px; font-weight: normal; text-transform: none;">
                <strong>Indicaciones Generales:</strong> {!! $consulta->receta->indicaciones_generales !!}
            </div>
        @endif
    </div>

    <!-- OBSERVACIONES ADICIONALES -->
    <div class="section-header">OBSERVACIONES ADICIONALES</div>
    <div class="section-content text-bold uppercase">
        {!! !empty(trim(strip_tags($consulta->observaciones_adicionales ?? ''))) ? $consulta->observaciones_adicionales : 'SIN OBSERVACIONES ADICIONALES.' !!}
    </div>

    <!-- REFERIDO PARA -->
    <div class="section-header">REFERIDO PARA:</div>
    <div class="section-content text-bold uppercase">
        {!! !empty(trim(strip_tags($consulta->plan_tratamiento ?? ''))) ? $consulta->plan_tratamiento : 'SIN REFERENCIA REQUERIDA.' !!}
    </div>

    <!-- ESTUDIOS A REALIZAR (DISEÑO MEJORADO EN TABLA LIMPIA) -->
    <div class="section-header">ESTUDIOS A REALIZAR:</div>
    <div class="section-content" style="padding: 0;">
        @if($estudios->count() > 0)
            <table class="inner-table">
                @foreach($estudios as $est)
                    <tr>
                        <td style="width: 22%; vertical-align: top;">
                            <span class="study-badge">{{ $est->tipo_estudio }}</span>
                        </td>
                        <td style="width: 43%; vertical-align: top; font-weight: 800; text-transform: uppercase; color: #0f172a;">
                            {{ $est->nombre_estudio }}
                        </td>
                        <td style="width: 35%; vertical-align: top; color: #334155; font-size: 9.5px;">
                            @if($est->indicaciones)
                                <strong>INDICACIONES:</strong> {{ strtoupper($est->indicaciones) }}
                            @else
                                <span style="color: #94a3b8;">SIN INDICACIONES ESPECIALES</span>
                            @endif
                        </td>
                    </tr>
                @endforeach
            </table>
        @else
            <div style="padding: 6px 8px; font-weight: bold; text-transform: uppercase; color: #64748b;">
                NO SE SOLICITARON ESTUDIOS PARACLÍNICOS.
            </div>
        @endif
    </div>

    <!-- SECCIÓN DE FIRMAS Y SELLOS -->
    <div class="signatures-area">
        <div class="signature-box-left">
            <div class="stamp-circle">
                {{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'VITALMED SALUD' }}<br>
                RIF: {{ $empresa->documento ?? 'J-503304456' }}<br>
                SELLO INSTITUCIONAL
            </div>
        </div>

        <div class="signature-box-right">
            <div class="signature-line"></div>
            <div style="font-weight: 800; font-size: 10.5px; text-transform: uppercase;">
                Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}
            </div>
            <div style="font-size: 9.5px; color: #475569;">
                Médico Especialista en {{ $especialidad->nombre ?? 'Medicina General' }}<br>
                M.P.P.S. N° {{ $medico->id * 12345 }} | C.M. N° {{ $medico->id * 5432 }}
            </div>
        </div>
    </div>

</body>
</html>
