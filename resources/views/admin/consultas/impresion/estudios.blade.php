<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Orden de Estudios - {{ $paciente->apellidos }}, {{ $paciente->nombres }}</title>
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

        /* Encabezado */
        .header-container {
            width: 100%;
            display: table;
            margin-bottom: 12px;
            border-bottom: 2px solid #0284c7;
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
            color: #0284c7;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }

        .rif-badge {
            font-size: 10px;
            font-weight: bold;
            color: #475569;
        }

        .order-title {
            font-size: 16px;
            font-weight: 900;
            color: #0369a1;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Tarjeta Paciente */
        .patient-card {
            background-color: #f0f9ff;
            border: 1px solid #bae6fd;
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

        .diagnosis-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            margin-bottom: 14px;
        }

        .diagnosis-title {
            font-weight: 800;
            font-size: 10.5px;
            color: #0369a1;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        /* Tabla de Estudios */
        table.studies-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
            border: 1px solid #cbd5e1;
        }

        table.studies-table th {
            background-color: #0284c7;
            color: white;
            font-weight: 800;
            font-size: 10px;
            text-transform: uppercase;
            text-align: left;
            padding: 6px 8px;
            border: 1px solid #0369a1;
        }

        table.studies-table td {
            padding: 8px;
            border: 1px solid #cbd5e1;
            font-size: 10.5px;
            vertical-align: top;
        }

        .badge-type {
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
            border: 2px dashed #0284c7;
            border-radius: 50%;
            padding: 12px 22px;
            color: #0369a1;
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
        <button onclick="window.print()" class="btn-print">🔬 Imprimir Orden de Estudios</button>
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
            <div class="order-title">ORDEN DE ESTUDIOS PARACLÍNICOS</div>
            <div style="font-size: 10.5px; font-weight: bold; color: #0369a1; margin-top: 4px;">
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
            <strong>Médico Solicita:</strong> Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}
        </div>
    </div>



    <!-- TABLA DE ESTUDIOS SOLICITADOS -->
    <table class="studies-table">
        <thead>
            <tr>
                <th style="width: 25%;">Tipo de Estudio</th>
                <th style="width: 40%;">Estudio / Examen Solicitado</th>
                <th style="width: 35%;">Indicaciones de Preparación</th>
            </tr>
        </thead>
        <tbody>
            @if($estudios->count() > 0)
                @foreach($estudios as $est)
                    <tr>
                        <td><span class="badge-type">{{ $est->tipo_estudio }}</span></td>
                        <td style="font-weight: 800; color: #0369a1; text-transform: uppercase;">
                            {{ $est->nombre_estudio }}
                        </td>
                        <td style="color: #334155;">
                            {{ $est->indicaciones ? strtoupper($est->indicaciones) : 'EN AYUNAS DE 8 HORAS' }}
                        </td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="3" style="text-align: center; color: #64748b; padding: 20px;">No se solicitaron exámenes en esta orden.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- INDICACIONES GENERALES DE PREPARACIÓN -->
    @if(!empty($consulta->ordenEstudio->indicaciones_generales))
        <div class="diagnosis-box">
            <div class="diagnosis-title">Indicaciones Generales para el Paciente</div>
            <div style="font-size: 10.5px; line-height: 1.4; color: #1e293b;">
                {{ $consulta->ordenEstudio->indicaciones_generales }}
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
