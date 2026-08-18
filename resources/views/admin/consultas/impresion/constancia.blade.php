<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Constancia de Asistencia Médica - {{ $paciente->apellidos }}, {{ $paciente->nombres }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm 20mm 15mm 20mm;
        }

        * {
            box-sizing: border-box;
        }

        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11.5px;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            line-height: 1.6;
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
            margin-bottom: 25px;
        }

        .header-left {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }

        .header-right {
            display: table-cell;
            width: 40%;
            vertical-align: top;
            text-align: right;
            font-size: 10px;
            color: #64748b;
        }

        .company-name {
            font-size: 18px;
            font-weight: 800;
            color: #0284c7;
            margin-bottom: 2px;
        }

        .company-info {
            font-size: 10px;
            color: #475569;
            line-height: 1.4;
        }

        .divider-line {
            width: 100%;
            height: 2px;
            background-color: #0284c7;
            margin-bottom: 15px;
        }

        .doc-meta {
            text-align: right;
            font-size: 10px;
            color: #64748b;
            margin-bottom: 15px;
            font-family: monospace;
        }

        /* Titulo Banner Azul */
        .title-banner {
            background-color: #2563eb;
            color: #ffffff;
            text-align: center;
            font-size: 15px;
            font-weight: 900;
            letter-spacing: 0.5px;
            padding: 10px 15px;
            text-transform: uppercase;
            border-radius: 4px;
            margin-bottom: 30px;
        }

        /* Tarjeta Paciente */
        .patient-box {
            border: 1.5px solid #3b82f6;
            background-color: #f0f9ff;
            border-radius: 6px;
            padding: 16px;
            text-align: center;
            margin: 25px 0;
        }

        .patient-name {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
        }

        .patient-details {
            font-size: 11.5px;
            font-weight: 700;
            color: #334155;
        }

        .content-paragraph {
            font-size: 12px;
            line-height: 1.8;
            color: #0f172a;
            text-align: justify;
            margin-bottom: 20px;
        }

        /* Firmas */
        .signatures-area {
            margin-top: 80px;
            text-align: center;
            page-break-inside: avoid;
        }

        .signature-line {
            width: 260px;
            border-top: 1.5px solid #0f172a;
            margin: 0 auto 8px auto;
        }

        .doctor-name {
            font-size: 12px;
            font-weight: 800;
            color: #0f172a;
        }

        .doctor-specialty {
            font-size: 10.5px;
            color: #64748b;
        }
    </style>
</head>
<body>

    @if(request()->has('format') && request()->format === 'html')
    <div class="no-print">
        <button onclick="window.print()" class="btn-print">🖨️ Imprimir Constancia</button>
        <button onclick="window.close()" class="btn-close">Cerrar</button>
    </div>
    @endif

    <!-- ENCABEZADO INSTITUCIONAL -->
    <div class="header-container">
        <div class="header-left">
            @if(!empty($empresa->logo))
                <img src="{{ asset('storage/' . $empresa->logo) }}" alt="Logo" style="max-height: 45px; margin-bottom: 4px;">
            @else
                <div class="company-name">{{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'VITALMED SALUD' }}</div>
            @endif
            <div class="company-info">
                @if(!empty($empresa->telefono)) Tel: {{ $empresa->telefono }}<br> @endif
                {{ $empresa->direccion ?? 'Centro Médico de Atención Especializada' }}
            </div>
        </div>
        <div class="header-right">
            RIF: {{ $empresa->documento ?? 'J-503304456' }}
        </div>
    </div>

    <div class="divider-line"></div>

    <div class="doc-meta">
        N° CONST-{{ str_pad($consulta->id, 6, '0', STR_PAD_LEFT) }} &nbsp;|&nbsp; Emitida: {{ date('d/m/Y H:i') }}
    </div>

    <!-- BANNER TÍTULO -->
    <div class="title-banner">
        CONSTANCIA DE ASISTENCIA MÉDICA
    </div>

    <!-- CUERPO PRINCIPAL DE LA CONSTANCIA -->
    <div class="content-paragraph">
        Quien suscribe, <strong>Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}</strong>, médico especialista en <strong>{{ $especialidad->nombre ?? 'Medicina General' }}</strong>, hace constar por medio de la presente que:
    </div>

    <!-- FICHA DESTACADA PACIENTE -->
    <div class="patient-box">
        <div class="patient-name">
            {{ $paciente->nombres }} {{ $paciente->apellidos }}
        </div>
        <div class="patient-details">
            C.I. / Documento: {{ $paciente->documento_identidad ?? $paciente->cedula ?? $paciente->codigo_paciente }} &nbsp;|&nbsp; Edad: {{ $edadPaciente ?? 'N/A' }} años
        </div>
    </div>

    <div class="content-paragraph">
        asistió a consulta de <strong>{{ $especialidad->nombre ?? 'Medicina General' }}</strong> el día 
        <strong>{{ $consulta->created_at ? $consulta->created_at->format('d/m/Y') : date('d/m/Y') }}</strong> 
        a las <strong>{{ $consulta->created_at ? $consulta->created_at->format('h:i A') : date('h:i A') }}</strong>, 
        en las instalaciones de esta institución, por motivo de: <strong>{{ $motivoConstancia ?? 'Consulta médica' }}</strong>.
    </div>

    <!-- ACOMPAÑANTE (SI APLICA) -->
    @if(!empty($incluirAcompanante) && $incluirAcompanante && !empty($nombreAcompanante))
        <div class="content-paragraph">
            Asimismo, se hace constar que el/la ciudadano(a) <strong>{{ $nombreAcompanante }}</strong>, 
            @if(!empty($cedulaAcompanante)) titular del documento N° <strong>{{ $cedulaAcompanante }}</strong>, @endif 
            asistió como acompañante, @if(!empty($relacionAcompanante)) en calidad de <strong>{{ strtolower($relacionAcompanante) }}</strong>, @endif 
            del paciente antes mencionado durante la consulta.
        </div>
    @endif

    <div class="content-paragraph" style="margin-top: 30px;">
        La presente constancia se expide a solicitud del interesado, a los {{ date('d') }} días del mes de {{ \Carbon\Carbon::now()->translatedFormat('F') }} de {{ date('Y') }}, para los fines que estime conveniente.
    </div>

    <!-- FIRMA MÉDICA -->
    <div class="signatures-area">
        <div class="signature-line"></div>
        <div class="doctor-name">Dr(a). {{ $medico->nombres }} {{ $medico->apellidos }}</div>
        <div class="doctor-specialty">{{ $especialidad->nombre ?? 'Medicina General' }}</div>
    </div>

</body>
</html>
