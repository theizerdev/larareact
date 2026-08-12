<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Técnico - {{ $orden->numero_orden }}</title>
    <style>
        @page {
            size: A4;
            margin: 10mm 12mm 10mm 12mm;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        body {
            background-color: #ffffff;
            color: #1e293b;
            font-size: 11px;
            line-height: 1.4;
            padding: 15px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 15px;
        }
        .header-table td {
            vertical-align: top;
        }
        .logo-img {
            max-height: 60px;
            max-width: 240px;
            object-fit: contain;
            margin-bottom: 5px;
        }
        .company-title {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.5px;
        }
        .company-sub {
            font-size: 10px;
            color: #475569;
            margin-top: 2px;
        }
        .doc-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: right;
        }
        .doc-title {
            font-size: 9px;
            font-weight: 900;
            color: #64748b;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .doc-num {
            font-size: 16px;
            font-weight: 900;
            color: #047857;
            font-family: monospace;
            margin: 2px 0;
        }
        .badge-status {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .grid-2 {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        .grid-2 td {
            width: 50%;
            vertical-align: top;
        }
        .card-box {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px;
        }
        .card-title {
            font-size: 10px;
            font-weight: 900;
            color: #475569;
            text-transform: uppercase;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
        }
        .section-title {
            font-size: 11px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #0f172a;
            padding-bottom: 3px;
            margin-top: 12px;
            margin-bottom: 8px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .data-table th {
            background-color: #f1f5f9;
            color: #334155;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        .data-table td {
            padding: 6px;
            border: 1px solid #cbd5e1;
            font-size: 10px;
        }
        .totals-table {
            width: 240px;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 5px;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 10px;
        }
        .qc-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .qc-grid td {
            width: 33.33%;
            padding: 4px 6px;
            border: 1px solid #e2e8f0;
            background-color: #ffffff;
            font-size: 9.5px;
        }
        .badge-ok {
            background-color: #d1fae5;
            color: #065f46;
            font-weight: 800;
            font-size: 8.5px;
            padding: 1px 4px;
            border-radius: 3px;
            float: right;
        }
        .badge-fail {
            background-color: #ffe4e6;
            color: #9f1239;
            font-weight: 800;
            font-size: 8.5px;
            padding: 1px 4px;
            border-radius: 3px;
            float: right;
        }
        .photo-gallery {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 15px;
        }
        .photo-gallery td {
            width: 25%;
            padding: 4px;
            text-align: center;
            vertical-align: top;
        }
        .photo-box {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 3px;
            background-color: #f8fafc;
        }
        .photo-img {
            width: 100%;
            height: 90px;
            object-fit: cover;
            border-radius: 3px;
            background-color: #0f172a;
        }
        .photo-caption {
            font-size: 8.5px;
            font-weight: 700;
            color: #334155;
            margin-top: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 25px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 20px;
        }
        .sig-line {
            border-top: 1px solid #0f172a;
            margin-top: 40px;
            padding-top: 4px;
            font-weight: 800;
            font-size: 10px;
            color: #0f172a;
        }
        .sig-sub {
            font-size: 9px;
            color: #64748b;
        }
        .print-btn-bar {
            background-color: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            text-align: right;
            margin-bottom: 15px;
            border-radius: 6px;
        }
        .btn-print {
            background-color: #10b981;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 800;
            border-radius: 4px;
            cursor: pointer;
        }
        @media print {
            .no-print {
                display: none !important;
            }
            body {
                padding: 0;
                background-color: #ffffff;
            }
        }
    </style>
</head>
<body>

    <div class="print-btn-bar no-print">
        <button onclick="window.print()" class="btn-print">🖨️ Imprimir / Guardar como PDF</button>
    </div>

    <!-- 1. ENCABEZADO OFICIAL DE EMPRESA Y SUCURSAL -->
    <table class="header-table">
        <tr>
            <td>
                @if(!empty($empresa->logo))
                    @php
                        $logoUrl = (str_starts_with($empresa->logo, 'http') || str_starts_with($empresa->logo, '/')) 
                            ? $empresa->logo 
                            : asset('storage/' . $empresa->logo);
                    @endphp
                    <img src="{{ $logoUrl }}" alt="{{ $empresa->nombre_comercial ?? 'Logo' }}" class="logo-img">
                @else
                    <div class="company-title">{{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'SERVITEC' }}</div>
                @endif
                <div class="company-sub">
                    <strong>{{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'Servicio Técnico Profesional' }}</strong><br>
                    @if(!empty($empresa->documento))
                        <strong>RUC / Tax ID:</strong> {{ $empresa->documento }}<br>
                    @endif
                    @if(!empty($sucursal->nombre))
                        <strong>Sucursal:</strong> {{ $sucursal->nombre }}<br>
                        <strong>Dirección Sucursal:</strong> {{ $sucursal->direccion ?? $empresa->direccion ?? 'N/A' }}<br>
                        <strong>Teléfono Sucursal:</strong> {{ $sucursal->telefono ?? $empresa->telefono ?? 'N/A' }}
                    @else
                        <strong>Dirección:</strong> {{ $empresa->direccion ?? 'Dirección Principal' }}<br>
                        <strong>Teléfono:</strong> {{ $empresa->telefono ?? 'N/A' }}
                    @endif
                    @if(!empty($empresa->email))
                        | ✉️ {{ $empresa->email }}
                    @endif
                </div>
            </td>
            <td style="width: 230px;">
                <div class="doc-box">
                    <div class="doc-title">Reporte Técnico de Entrega</div>
                    <div class="doc-num">{{ $orden->numero_orden }}</div>
                    <div>
                        <span class="badge-status">{{ str_replace('_', ' ', $orden->estado_orden) }}</span>
                    </div>
                    <div style="font-size: 8.5px; color: #64748b; margin-top: 6px; border-top: 1px solid #cbd5e1; padding-top: 4px;">
                        <strong>Ingreso:</strong> {{ \Carbon\Carbon::parse($orden->fecha_recepcion)->format('d/m/Y H:i') }}<br>
                        <strong>Finalizado:</strong> {{ $orden->fecha_entrega ? \Carbon\Carbon::parse($orden->fecha_entrega)->format('d/m/Y') : date('d/m/Y') }}<br>
                        <strong>Técnico:</strong> {{ $orden->tecnico->name ?? 'Taller Técnico' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 2. DATOS DE CLIENTE Y DISPOSITIVO -->
    <table class="grid-2">
        <tr>
            <td style="padding-right: 5px;">
                <div class="card-box">
                    <div class="card-title">👤 Datos del Cliente</div>
                    <strong>{{ $orden->cliente->nombre ?? $orden->cliente_nombre }}</strong><br>
                    📞 {{ $orden->cliente->telefono ?? $orden.cliente_telefono ?? 'Sin teléfono' }}<br>
                    @if(!empty($orden->cliente->email))
                        ✉️ {{ $orden->cliente->email }}
                    @endif
                </div>
            </td>
            <td style="padding-left: 5px;">
                <div class="card-box">
                    <div class="card-title">📱 Detalles del Equipo</div>
                    <strong>{{ $orden->tipo_dispositivo }} {{ $orden->marca_nombre }} {{ $orden->modelo_nombre }}</strong><br>
                    Color: <strong>{{ $orden->color ?? 'N/A' }}</strong> | IMEI/SN: <strong>{{ $orden->imei_serie ?? 'N/A' }}</strong><br>
                    Seguridad: <strong>{{ !empty($orden->contrasena_patron) ? 'Registrada (' . $orden->contrasena_patron . ')' : 'Sin Clave' }}</strong>
                </div>
            </td>
        </tr>
    </table>

    <!-- 3. DIAGNÓSTICO E INFORME INICIAL -->
    <div class="section-title">1. Diagnóstico Inicial & Motivo de Reparación</div>
    <div class="card-box" style="margin-bottom: 12px;">
        <p><strong>Falla Reportada:</strong> {{ $orden->descripcion_falla }}</p>
        @if(!empty($orden->observaciones_fisicas))
            <p style="margin-top: 4px;"><strong>Observaciones Físicas de Entrada:</strong> {{ $orden->observaciones_fisicas }}</p>
        @endif
    </div>

    <!-- 4. TRABAJOS REALIZADOS Y COSTOS -->
    <div class="section-title">2. Trabajos Realizados & Repuestos Aplicados</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Descripción / Servicio / Repuesto</th>
                <th style="text-align: center; width: 50px;">Cant.</th>
                <th style="text-align: right; width: 80px;">P. Unit.</th>
                <th style="text-align: right; width: 90px;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($orden->items) && count($orden->items) > 0)
                @foreach($orden->items as $item)
                    <tr>
                        <td><strong>{{ $item->descripcion }}</strong></td>
                        <td style="text-align: center;">{{ $item->cantidad }}</td>
                        <td style="text-align: right;">{{ $currencySymbol }}{{ number_format($item->precio_venta, 2) }}</td>
                        <td style="text-align: right; font-weight: bold;">{{ $currencySymbol }}{{ number_format($item->subtotal, 2) }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="4" style="text-align: center; font-style: italic; color: #64748b;">
                        Servicio de reparación técnica integral según diagnóstico.
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Total Estimado:</td>
            <td style="text-align: right; font-weight: bold;">{{ $currencySymbol }}{{ number_format($orden->costo_estimado ?? 0, 2) }}</td>
        </tr>
        <tr>
            <td style="color: #047857;">Anticipo Recibido:</td>
            <td style="text-align: right; font-weight: bold; color: #047857;">-{{ $currencySymbol }}{{ number_format($orden->anticipo ?? 0, 2) }}</td>
        </tr>
        <tr style="border-top: 1.5px solid #0f172a; font-weight: 900; font-size: 11px;">
            <td>SALDO A CANCELAR:</td>
            <td style="text-align: right; color: #047857;">{{ $currencySymbol }}{{ number_format($orden->saldo_restante ?? 0, 2) }}</td>
        </tr>
    </table>

    <!-- 5. CONTROL DE CALIDAD Y POST-ATENCIÓN -->
    @php
        $postData = is_string($orden->post_servicio_json) ? json_decode($orden->post_servicio_json, true) : $orden->post_servicio_json;
        $validacionMap = $postData['validacion'] ?? [];
    @endphp

    @if(!empty($validacionMap) && count($validacionMap) > 0)
        <div class="section-title">3. Validación Final de Funciones Electrónicas (QC)</div>
        <table class="qc-grid">
            @php
                $keys = array_keys($validacionMap);
                $chunks = array_chunk($keys, 3);
            @endphp
            @foreach($chunks as $rowKeys)
                <tr>
                    @foreach($rowKeys as $key)
                        @php $val = $validacionMap[$key] ?? []; $isOk = ($val['estado'] ?? '') === 'correcto'; @endphp
                        <td>
                            <span>{{ $key }}</span>
                            @if($isOk)
                                <span class="badge-ok">✓ OK</span>
                            @else
                                <span class="badge-fail">✗ Falla</span>
                            @endif
                        </td>
                    @endforeach
                    @for($i = count($rowKeys); $i < 3; $i++)
                        <td style="border: none; background: transparent;"></td>
                    @endfor
                </tr>
            @endforeach
        </table>
    @endif

    @if(!empty($postData['observaciones']))
        <div class="card-box" style="margin-bottom: 12px; background-color: #ecfdf5; border-color: #a7f3d0;">
            <strong style="color: #065f46;">Notas Técnicas del Especialista:</strong> {{ $postData['observaciones'] }}
        </div>
    @endif

    <!-- 6. EVIDENCIAS FOTOGRÁFICAS DE REPARACIÓN -->
    @php
        $fotosList = [];
        if (!empty($orden->fotos) && count($orden->fotos) > 0) {
            foreach($orden->fotos as $f) {
                if (!empty($f->url)) {
                    $fotosList[] = [
                        'title' => $f->descripcion ?? $f->angulo ?? 'Evidencia Taller',
                        'url' => $f->url
                    ];
                }
            }
        }
        $inspeccionData = is_string($orden->inspeccion_json) ? json_decode($orden->inspeccion_json, true) : $orden->inspeccion_json;
        if (!empty($inspeccionData['fotos_recepcion']) && is_array($inspeccionData['fotos_recepcion'])) {
            foreach($inspeccionData['fotos_recepcion'] as $k => $v) {
                if (!empty($v) && is_string($v)) {
                    $fotosList[] = [
                        'title' => 'Recepción: ' . strtoupper(str_replace('_', ' ', $k)),
                        'url' => $v
                    ];
                }
            }
        }
    @endphp

    @if(count($fotosList) > 0)
        <div class="section-title">4. Galería de Evidencias Fotográficas ({{ count($fotosList) }} Fotos)</div>
        <table class="photo-gallery">
            @php $photoChunks = array_chunk($fotosList, 4); @endphp
            @foreach($photoChunks as $pRow)
                <tr>
                    @foreach($pRow as $foto)
                        <td>
                            <div class="photo-box">
                                <img src="{{ $foto['url'] }}" alt="{{ $foto['title'] }}" class="photo-img">
                                <div class="photo-caption">{{ $foto['title'] }}</div>
                            </div>
                        </td>
                    @endforeach
                    @for($j = count($pRow); $j < 4; $j++)
                        <td></td>
                    @endfor
                </tr>
            @endforeach
        </table>
    @endif

    <!-- 7. CONFORMIDAD Y FIRMAS -->
    <table class="signatures-table">
        <tr>
            <td colspan="2" style="font-size: 8.5px; color: #64748b; font-style: italic; text-align: center; padding-bottom: 15px;">
                El cliente declara recibir el dispositivo arriba detallado en óptimas condiciones de funcionamiento tras haber realizado las pruebas correspondientes del servicio técnico. La garantía cubre únicamente la falla intervenida por el período acordado. Quedan excluidos equipos expuestos a humedad, caídas o manipulación de terceros.
            </td>
        </tr>
        <tr>
            <td>
                <div class="sig-line">Firma de Conformidad del Cliente</div>
                <div class="sig-sub">{{ $orden->cliente->nombre ?? $orden->cliente_nombre }}</div>
                <div class="sig-sub">DNI / Doc: ___________________</div>
            </td>
            <td>
                <div class="sig-line">Firma y Sello Técnico Responsable</div>
                <div class="sig-sub">{{ $orden->tecnico->name ?? 'Servicio Técnico Taller' }}</div>
                <div class="sig-sub">{{ $empresa->nombre_comercial ?? 'Empresa' }}</div>
            </td>
        </tr>
    </table>

    <!-- 8. CÓDIGO QR DE VERIFICACIÓN / REPORTE COMPLETO -->
    @php
        $fullReportUrl = url("/admin/reparaciones/{$orden->id}/reporte-pdf");
        $qrCodeApiUrl = "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=" . urlencode($fullReportUrl);
    @endphp
    <div style="margin-top: 20px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; page-break-inside: avoid;">
        <img src="{{ $qrCodeApiUrl }}" alt="QR Reporte" style="width: 85px; height: 85px;">
        <div style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #1e293b; margin-top: 4px;">
            CÓDIGO DE REPARACIÓN: {{ $orden->numero_orden }}
        </div>
        <div style="font-size: 7.5px; color: #64748b; font-family: monospace;">
            Escanee el código QR para consultar el reporte oficial y fotografías
        </div>
    </div>

</body>
</html>
