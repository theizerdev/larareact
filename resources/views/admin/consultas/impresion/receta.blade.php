<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receta Médica - {{ $paciente->apellidos }}, {{ $paciente->nombres }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm 12mm 15mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11px;
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
            background-color: #059669;
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

        /* Encabezado */
        .header-container {
            width: 100%;
            display: table;
            margin-bottom: 12px;
            border-bottom: 2px solid #059669;
            padding-bottom: 8px;
        }

        .header-left {
            display: table-cell;
            width: 55%;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            width: 45%;
            vertical-align: top;
            text-align: right;
        }

        .logo-title {
            font-size: 18px;
            font-weight: 900;
            color: #059669;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }

        .rif-badge {
            font-size: 10px;
            font-weight: bold;
            color: #475569;
        }

        .recipe-title {
            font-size: 16px;
            font-weight: 900;
            color: #047857;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Tarjeta de Datos del Paciente */
        .patient-card {
            background-color: #f0fdf4;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 14px;
            width: 100%;
            display: table;
        }

        .patient-cell-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
            font-size: 10.5px;
            line-height: 1.5;
        }

        .patient-cell-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            text-align: right;
            font-size: 10.5px;
            line-height: 1.5;
        }

        /* Tabla de Prescripción */
        table.medicines-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            border: 1px solid #cbd5e1;
        }

        table.medicines-table th {
            background-color: #059669;
            color: white;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #047857;
        }

        table.medicines-table td {
            padding: 8px;
            border: 1px solid #cbd5e1;
            font-size: 10.5px;
            vertical-align: top;
        }

        /* Sección de Indicaciones Generales */
        .section-box {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            margin-bottom: 14px;
            background-color: #f8fafc;
        }

        .section-box-title {
            font-weight: 800;
            font-size: 10.5px;
            color: #047857;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        /* Firmas */
        .signatures-area {
            margin-top: 45px;
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
            border: 2px dashed #059669;
            border-radius: 50%;
            padding: 12px 22px;
            color: #047857;
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
    <!-- Botones de Impresión en Pantalla (solo vista HTML) -->
    <div class="no-print">
        <button onclick="window.print()" class="btn-print">💊 Imprimir Receta Médica</button>
        <button onclick="window.close()" class="btn-close">Cerrar</button>
    </div>
    @endif

    <!-- ENCABEZADO INSTITUCIONAL -->
    <div class="header-container">
        <div class="header-left">
            @if(!empty($empresa->logo))
                <img src="{{ asset('storage/' . $empresa->logo) }}" alt="Logo" style="max-height: 42px; margin-bottom: 4px;">
            @else
                <div class="logo-title">{{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'VITALMED SALUD' }}</div>
            @endif
            <div class="rif-badge">RIF: {{ $empresa->documento ?? 'J-503304456' }}</div>
            <div style="font-size: 9.5px; color: #475569; margin-top: 2px;">{{ $empresa->direccion ?? 'Centro Médico de Atención Especializada' }}</div>
        </div>

        <div class="header-right">
            <div class="recipe-title">RECETA MÉDICA (RP)</div>
            <div style="font-size: 10.5px; font-weight: bold; color: #047857; margin-top: 4px;">
                Fecha: {{ $consulta->created_at ? $consulta->created_at->format('d/m/Y') : date('d/m/Y') }}
            </div>
        </div>
    </div>

    <!-- FICHA PACIENTE -->
    <div class="patient-card">
        <div class="patient-cell-left">
            <strong>Paciente:</strong> {{ $paciente->apellidos }}, {{ $paciente->nombres }}<br>
            <strong>Cédula / ID:</strong> {{ $paciente->documento_identidad ?? $paciente->cedula ?? $paciente->codigo_paciente }}
        </div>
        <div class="patient-cell-right">
            <strong>Edad:</strong> {{ $edadPaciente ?? 'N/A' }} años<br>
            <strong>Médico:</strong> Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}
        </div>
    </div>

    <!-- TABLA DE MEDICAMENTOS PRESCRITOS -->
    <table class="medicines-table">
        <thead>
            <tr>
                <th style="width: 32%;">Medicamento Prescrito</th>
                <th style="width: 20%;">Dosis & Vía</th>
                <th style="width: 20%;">Frecuencia & Días</th>
                <th style="width: 28%;">Instrucciones Posológicas</th>
            </tr>
        </thead>
        <tbody>
            @if($medicamentos->count() > 0)
                @foreach($medicamentos as $med)
                    @php
                        // Evitar duplicación de "Cada Cada"
                        $frecuenciaRaw = $med->frecuencia ?? '8 horas';
                        $frecuenciaLimpia = preg_replace('/^cada\s+/i', '', trim($frecuenciaRaw));

                        // Limpiar repetición de nombre del medicamento en las instrucciones
                        $instruccionesRaw = $med->instrucciones ?? 'Tomar según indicación médica';
                        $instruccionesLimpias = preg_replace('/^' . preg_quote($med->medicamento_nombre, '/') . '\s*:\s*/i', '', trim($instruccionesRaw));
                    @endphp
                    <tr>
                        <td style="font-weight: 800; color: #047857; text-transform: uppercase;">
                            {{ $med->medicamento_nombre }}
                        </td>
                        <td style="font-weight: 600; color: #1e293b;">
                            {{ $med->dosis }} • {{ $med->via_administracion }}
                        </td>
                        <td style="color: #334155;">
                            Cada {{ $frecuenciaLimpia }} por {{ $med->duracion_dias }} días
                        </td>
                        <td style="color: #0f172a; font-weight: 500;">
                            {{ $instruccionesLimpias }}
                        </td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" style="text-align: center; color: #64748b; padding: 20px;">No se prescribieron medicamentos en esta atención.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- INDICACIONES GENERALES DE LA RECETA -->
    @if(!empty($consulta->receta->indicaciones_generales) && $consulta->receta->indicaciones_generales !== 'Reposo relativo e hidratación abundante.')
        <div class="section-box">
            <div class="section-box-title">Indicaciones Generales de la Receta</div>
            <div style="font-size: 10.5px; line-height: 1.4; color: #1e293b;">
                {{ $consulta->receta->indicaciones_generales }}
            </div>
        </div>
    @endif

    <!-- FIRMA Y SELLO MÉDICO -->
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
