<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Cédula de Enrolamiento Biométrico - {{ $cedula->uuid }}</title>
    <style>
        @page {
            margin: 26px 30px 42px 30px;
        }
        body {
            font-family: DejaVu Sans, Helvetica, Arial, sans-serif;
            font-size: 10px;
            color: #1e293b;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .page-break {
            page-break-before: always;
        }
        .header-table {
            width: 100%;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 10px;
            margin-bottom: 14px;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin: 0 0 3px 0;
        }
        .subtitle {
            font-size: 8.5px;
            color: #64748b;
            margin: 0;
        }
        .brand-box {
            text-align: right;
            vertical-align: top;
        }
        .brand-name {
            font-size: 13px;
            font-weight: bold;
            color: #1d4ed8;
            margin: 0;
        }
        .brand-sub {
            font-size: 8px;
            color: #64748b;
            margin: 2px 0 0 0;
        }
        .meta-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px 12px;
            margin-bottom: 14px;
        }
        .meta-row {
            margin-bottom: 4px;
            font-size: 9.2px;
        }
        .meta-row:last-child {
            margin-bottom: 0;
        }
        .meta-label {
            font-weight: bold;
            color: #334155;
        }
        .mono {
            font-family: DejaVu Sans Mono, Courier, monospace;
            font-size: 8.2px;
            word-break: break-all;
        }
        .badge-ok {
            display: inline-block;
            background-color: #dcfce7;
            color: #166534;
            border: 1px solid #86efac;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 8.5px;
            font-weight: bold;
        }
        .badge-indigo {
            display: inline-block;
            background-color: #e0e7ff;
            color: #3730a3;
            border: 1px solid #a5b4fc;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: bold;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 4px;
            margin: 12px 0 8px 0;
        }
        .grid-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }
        .grid-table td {
            border: 1px solid #e2e8f0;
            padding: 6px 8px;
            vertical-align: top;
            background-color: #ffffff;
        }
        .field-label {
            font-size: 7.5px;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .field-value {
            font-size: 9.8px;
            font-weight: bold;
            color: #0f172a;
        }
        .log-card {
            border: 1px solid #cbd5e1;
            border-left: 4px solid #4f46e5;
            border-radius: 5px;
            padding: 8px 10px;
            margin-bottom: 8px;
            background-color: #ffffff;
        }
        .log-card.enrolamiento {
            border-left-color: #059669;
        }
        .log-header-table {
            width: 100%;
            margin-bottom: 4px;
        }
        .log-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }
        .log-time {
            text-align: right;
            font-size: 8.5px;
            color: #475569;
            font-weight: bold;
        }
        .log-detail-table {
            width: 100%;
            font-size: 8.3px;
            color: #475569;
            margin-top: 4px;
        }
        .log-detail-table td {
            vertical-align: top;
            padding: 1px 4px 1px 0;
        }
        .seal-box {
            border: 1.5px solid #334155;
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 10px 12px;
            margin-top: 14px;
        }
        .seal-title {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
            text-transform: uppercase;
            margin: 0 0 4px 0;
        }
        .seal-text {
            font-size: 8.3px;
            color: #475569;
            margin: 0 0 6px 0;
        }
        .seal-stamp {
            border: 2px solid #0f172a;
            border-radius: 4px;
            padding: 6px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 8.5px;
            color: #0f172a;
            background-color: #ffffff;
        }
        .photo-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .photo-table td {
            width: 50%;
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: center;
            vertical-align: top;
            background-color: #ffffff;
        }
        .photo-wrapper {
            position: relative;
            display: inline-block;
            width: 220px;
            height: 220px;
            overflow: hidden;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            background-color: #0f172a;
        }
        .photo-wrapper img {
            width: 220px;
            height: 220px;
            object-fit: cover;
        }
        .watermark {
            position: absolute;
            top: 86px;
            left: 0;
            width: 220px;
            text-align: center;
            background-color: rgba(15, 23, 42, 0.55);
            color: #ffffff;
            padding: 5px 0;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 1.5px;
        }
        .footer {
            position: fixed;
            bottom: -24px;
            left: 0;
            right: 0;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            font-size: 7.5px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="footer">
        Cédula de Enrolamiento Biométrico • Folio: <span class="mono">{{ $cedula->uuid }}</span> • Expediente Colaborador ID #{{ $cedula->empleado_id }} • {{ $empresaNombre }}
    </div>

    {{-- PÁGINA 1: INFORME DE ENROLAMIENTO, LOGS Y SELLO DIGITAL --}}
    <table class="header-table">
        <tr>
            <td style="width: 65%; vertical-align: top;">
                <p class="title">Cédula de Enrolamiento Biométrico</p>
                <p class="subtitle">Fechas y horas en {{ $zonaHoraria }}</p>
                <p class="subtitle">Última actualización: {{ $fechaEmision }}</p>
            </td>
            <td class="brand-box" style="width: 35%;">
                <p class="brand-name">{{ $empresaNombre }}</p>
                <p class="brand-sub">Expediente Digital del Colaborador</p>
                <p class="brand-sub">Control Biométrico &amp; BioTime</p>
            </td>
        </tr>
    </table>

    <div class="meta-box">
        <div class="meta-row">
            <span class="meta-label">Estado:</span>
            <span class="badge-ok">ENROLADO Y VALIDADO</span>
            &nbsp;&nbsp;
            <span class="meta-label">Origen:</span>
            <span class="badge-indigo">{{ strtoupper($cedula->origen) }}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Documento:</span> Cédula de Enrolamiento Biométrico Facial y Consentimiento de Privacidad
        </div>
        <div class="meta-row">
            <span class="meta-label">Número / Folio:</span> <span class="mono">{{ $cedula->uuid }}</span>
        </div>
        <div class="meta-row">
            <span class="meta-label">Fecha de creación:</span> {{ $fechaEmision }}
        </div>
        <div class="meta-row">
            <span class="meta-label">Sello Digital de Integridad (HMAC-SHA256):</span>
            <span class="mono">{{ $cedula->sello_digital }}</span>
        </div>
    </div>

    <div class="section-title">1. Información Oficial del Colaborador</div>
    <table class="grid-table">
        <tr>
            <td style="width: 25%;">
                <div class="field-label">No. de Empleado</div>
                <div class="field-value mono">{{ $cedula->no_empleado ?: '—' }}</div>
            </td>
            <td style="width: 15%;">
                <div class="field-label">ID</div>
                <div class="field-value mono">#{{ $cedula->empleado_id }}</div>
            </td>
            <td style="width: 25%;">
                <div class="field-label">Legacy</div>
                <div class="field-value mono">{{ $cedula->codigo_legacy ?: '—' }}</div>
            </td>
            <td style="width: 35%;">
                <div class="field-label">Nombre Completo</div>
                <div class="field-value">{{ $cedula->nombre_completo }}</div>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <div class="field-label">Área / Departamento</div>
                <div class="field-value">{{ $cedula->area_departamento ?: 'General' }}</div>
            </td>
            <td>
                <div class="field-label">Puesto / Cargo</div>
                <div class="field-value">{{ $cedula->puesto_cargo ?: 'Operativo' }}</div>
            </td>
            <td>
                <div class="field-label">Correo / Datos Complementarios</div>
                <div class="field-value" style="font-size: 8.8px;">
                    {{ $cedula->correo ?: 'Sin correo' }}<br>
                    <span style="font-weight: normal; color: #475569;">Sexo: {{ $generoLabel }} • F. Nac.: {{ $fechaNacimiento }}</span>
                </div>
            </td>
        </tr>
    </table>

    <div class="section-title">2. Registro de Acciones y Trazabilidad del Proceso (Logs)</div>

    @foreach($logs as $log)
        <div class="log-card {{ $log->accion === 'enrolamiento' ? 'enrolamiento' : '' }}">
            <table class="log-header-table">
                <tr>
                    <td>
                        <span class="badge-ok">{{ strtoupper($log->etiqueta) }}</span>
                        &nbsp;
                        <span class="log-title">{{ $log->descripcion }}</span>
                    </td>
                    <td class="log-time">
                        {{ $log->ocurrido_en?->timezone($zonaHoraria)->format('d/m/Y H:i:s') }}
                    </td>
                </tr>
            </table>
            <table class="log-detail-table">
                <tr>
                    <td style="width: 50%;">
                        <strong>Token de acción:</strong> <span class="mono">{{ $log->uuid }}</span><br>
                        <strong>Acción registrada:</strong> {{ $log->accion }} ({{ $log->etiqueta }})<br>
                        <strong>Hash de evento (SHA-256):</strong> <span class="mono">{{ $log->hash_evento }}</span>
                    </td>
                    <td style="width: 50%;">
                        <strong>Dirección IP:</strong> {{ $log->ip_address ?: 'No disponible' }}<br>
                        <strong>Ubicación aproximada:</strong>
                        @if($log->latitud && $log->longitud)
                            {{ number_format($log->latitud, 6) }}, {{ number_format($log->longitud, 6) }}
                        @else
                            Planta / Quiosco Local
                        @endif
                        <br>
                        <strong>Dispositivo:</strong> {{ \Illuminate\Support\Str::limit($log->user_agent ?: 'No registrado', 105) }}
                    </td>
                </tr>
            </table>
        </div>
    @endforeach

    <div class="seal-box">
        <table style="width: 100%;">
            <tr>
                <td style="width: 72%; vertical-align: top; padding-right: 10px;">
                    <p class="seal-title">Sello Digital y Constancia de Integridad</p>
                    <p class="seal-text">
                        Este documento certifica que el colaborador otorgó su consentimiento expreso al Aviso de Privacidad Biométrico y completó su enrolamiento facial. El sello digital criptográfico fue calculado con algoritmo <strong>HMAC-SHA256</strong> combinando los registros de logs (Aviso de Privacidad y Enrolamiento), marcas de tiempo, IP, dispositivo y los hashes SHA-256 de las capturas fotográficas.
                    </p>
                    <div class="mono" style="background: #ffffff; border: 1px solid #cbd5e1; padding: 5px 7px; border-radius: 4px;">
                        <strong>SELLO:</strong> {{ $cedula->sello_digital }}<br>
                        <strong>FOTO 1 (SHA-256):</strong> {{ $cedula->foto_1_hash ?: '—' }}<br>
                        <strong>FOTO 2 (SHA-256):</strong> {{ $cedula->foto_2_hash ?: '—' }}
                    </div>
                </td>
                <td style="width: 28%; vertical-align: middle;">
                    <div class="seal-stamp">
                        SELLO DIGITAL<br>
                        VERIFICADO<br>
                        <span style="font-size: 7px; font-weight: normal; color: #475569;">HMAC-SHA256</span><br>
                        <span style="font-size: 7px; font-weight: normal; color: #166534;">INTEGRIDAD ACTIVA</span><br>
                        <span class="mono" style="font-size: 7px;">{{ substr((string) $cedula->sello_digital, 0, 16) }}</span>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    {{-- PÁGINA 2: ANEXOS FOTOGRÁFICOS --}}
    <div class="page-break"></div>

    <table class="header-table">
        <tr>
            <td style="width: 65%; vertical-align: top;">
                <p class="title">Anexos Fotográficos Biométricos</p>
                <p class="subtitle">Cédula de Enrolamiento • Folio: {{ $cedula->uuid }}</p>
                <p class="subtitle">Fecha y hora de validación: {{ $fechaValidacion }}</p>
            </td>
            <td class="brand-box" style="width: 35%;">
                <p class="brand-name">{{ $empresaNombre }}</p>
                <p class="brand-sub">{{ $cedula->nombre_completo }}</p>
                <p class="brand-sub">No. Empleado: {{ $cedula->no_empleado }} • ID #{{ $cedula->empleado_id }}</p>
            </td>
        </tr>
    </table>

    <table class="photo-table">
        <tr>
            <td>
                <div class="field-label" style="margin-bottom: 6px;">Foto 1 — Toma Frontal Principal</div>
                @if($foto1DataUri)
                    <div class="photo-wrapper">
                        <img src="{{ $foto1DataUri }}" alt="Foto 1">
                        <div class="watermark">
                            CONFIDENCIAL<br>
                            {{ $fechaValidacion }}
                        </div>
                    </div>
                @else
                    <p style="color: #94a3b8;">Sin imagen disponible</p>
                @endif
                <div class="mono" style="margin-top: 8px; font-size: 7.2px; color: #475569;">
                    SHA-256: {{ $cedula->foto_1_hash ?: '—' }}
                </div>
            </td>
            <td>
                <div class="field-label" style="margin-bottom: 6px;">Foto 2 — Toma Frontal de Validación</div>
                @if($foto2DataUri)
                    <div class="photo-wrapper">
                        <img src="{{ $foto2DataUri }}" alt="Foto 2">
                        <div class="watermark">
                            CONFIDENCIAL<br>
                            {{ $fechaValidacion }}
                        </div>
                    </div>
                @else
                    <p style="color: #94a3b8;">Sin imagen disponible</p>
                @endif
                <div class="mono" style="margin-top: 8px; font-size: 7.2px; color: #475569;">
                    SHA-256: {{ $cedula->foto_2_hash ?: '—' }}
                </div>
            </td>
        </tr>
    </table>

    <div class="seal-box" style="margin-top: 18px;">
        <p class="seal-title">Resguardo en Expediente del Colaborador</p>
        <p class="seal-text">
            Esta cédula y sus anexos fotográficos forman parte integral del expediente digital del colaborador <strong>{{ $cedula->nombre_completo }}</strong> (No. Empleado: <strong>{{ $cedula->no_empleado }}</strong>, ID: <strong>#{{ $cedula->empleado_id }}</strong>, Legacy: <strong>{{ $cedula->codigo_legacy ?: '—' }}</strong>). Su alteración invalida el sello digital de integridad.
        </p>
    </div>
</body>
</html>
