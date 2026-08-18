<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Reposo Médico - {{ $paciente->apellidos }}, {{ $paciente->nombres }}</title>
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
            background-color: #d97706;
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
            margin-bottom: 15px;
            border-bottom: 2px solid #d97706;
            padding-bottom: 10px;
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
            color: #d97706;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }

        .rif-badge {
            font-size: 10px;
            font-weight: bold;
            color: #475569;
        }

        .document-title {
            font-size: 16px;
            font-weight: 900;
            color: #b45309;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Tarjeta Paciente */
        .patient-card {
            background-color: #fffbeb;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 20px;
            width: 100%;
            display: table;
        }

        .patient-cell-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
            font-size: 11px;
            line-height: 1.6;
        }

        .patient-cell-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            text-align: right;
            font-size: 11px;
            line-height: 1.6;
        }

        /* Cuerpo del Certificado */
        .certificate-body {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            line-height: 1.8;
            font-size: 12px;
            color: #1e293b;
            text-align: justify;
        }

        .highlight-box {
            background-color: #fef3c7;
            border-left: 4px solid #d97706;
            padding: 12px 16px;
            margin: 15px 0;
            border-radius: 4px;
            font-size: 11.5px;
        }

        .highlight-title {
            font-weight: 800;
            color: #92400e;
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        /* Firmas */
        .signatures-area {
            margin-top: 50px;
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
            border: 2px dashed #d97706;
            border-radius: 50%;
            padding: 12px 22px;
            color: #b45309;
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
        <button onclick="window.print()" class="btn-print">📜 Imprimir Certificado de Reposo</button>
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
            <div class="document-title">CERTIFICADO DE REPOSO MÉDICO</div>
            <div style="font-size: 10.5px; font-weight: bold; color: #b45309; margin-top: 4px;">
                Emisión: {{ $consulta->created_at ? $consulta->created_at->format('d/m/Y') : date('d/m/Y') }}
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
            <strong>Médico Tratante:</strong> Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}
        </div>
    </div>

    <!-- CUERPO DEL CERTIFICADO -->
    <div class="certificate-body">
        <p style="margin-top: 0;">
            Quien suscribe, <strong>Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}</strong>, médico especialista en <strong>{{ $especialidad->nombre ?? 'Medicina General' }}</strong>, certifica por medio del presente documento que en la fecha ha evaluado en consulta médica al paciente <strong>{{ $paciente->nombres }} {{ $paciente->apellidos }}</strong>, titular de la Cédula de Identidad <strong>{{ $paciente->documento_identidad ?? $paciente->cedula ?? $paciente->codigo_paciente }}</strong>.
        </p>

        <p>
            Tras la evaluación clínica pertinente, se concluye que el/la paciente presenta condición de salud que requiere <strong>REPOSO MÉDICO {{ strtoupper($reposo->tipo_reposo ?? 'RELATIVO') }}</strong> por un período de <strong>{{ $reposo->dias_reposo ?? 1 }} DÍA(S)</strong> consecutivo(s).
        </p>

        <!-- CUADRO DE FECHAS -->
        <div class="highlight-box">
            <div class="highlight-title">Período de Incapacidad / Reposo Médico</div>
            <div style="display: table; width: 100%; margin-top: 6px;">
                <div style="display: table-cell; width: 33.3%;">
                    <strong>Fecha Inicio:</strong><br>
                    {{ $reposo->fecha_inicio ? \Carbon\Carbon::parse($reposo->fecha_inicio)->format('d/m/Y') : date('d/m/Y') }}
                </div>
                <div style="display: table-cell; width: 33.3%;">
                    <strong>Fecha Culminación:</strong><br>
                    {{ $reposo->fecha_fin ? \Carbon\Carbon::parse($reposo->fecha_fin)->format('d/m/Y') : date('d/m/Y') }}
                </div>
                <div style="display: table-cell; width: 33.3%;">
                    <strong>Reincorporación Estimada:</strong><br>
                    {{ $reposo->fecha_fin ? \Carbon\Carbon::parse($reposo->fecha_fin)->addDay()->format('d/m/Y') : date('d/m/Y') }}
                </div>
            </div>
        </div>

        <!-- DIAGNÓSTICO O MOTIVO -->
        @if(!empty($reposo->motivo_reposo))
            <p>
                <strong>Motivo / Justificación Médica:</strong><br>
                {{ $reposo->motivo_reposo }}
            </p>
        @elseif($diagnosticosCie10->count() > 0)
            <p>
                <strong>Diagnóstico Asociado (CIE-10):</strong><br>
                @foreach($diagnosticosCie10 as $diag)
                    • [{{ $diag->codigo }}] {{ $diag->nombre }}<br>
                @endforeach
            </p>
        @endif

        @if(!empty($reposo->observaciones))
            <p>
                <strong>Observaciones Adicionales:</strong><br>
                {{ $reposo->observaciones }}
            </p>
        @endif

        <p style="margin-bottom: 0; font-size: 11px; color: #475569; margin-top: 15px;">
            Constancia que se expide a solicitud de la parte interesada a los {{ date('d') }} días del mes de {{ \Carbon\Carbon::now()->translatedFormat('F') }} de {{ date('Y') }}.
        </p>
    </div>

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
