<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Técnico - {{ $orden->numero_orden }}</title>
    <style>
        @page {
            size: A4;
            margin: 8mm 10mm 10mm 10mm;
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
            line-height: 1.45;
            padding: 10px 15px;
        }

        /* BARRA SUPERIOR DE IMPRESIÓN (SOLO EN NAVEGADOR) */
        .print-btn-bar {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #ffffff;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 18px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        .btn-print {
            background-color: #10b981;
            color: #ffffff;
            border: none;
            padding: 8px 18px;
            font-size: 12px;
            font-weight: 800;
            border-radius: 6px;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn-print:hover {
            background-color: #059669;
        }

        /* ENCABEZADO PRINCIPAL DE IMPACTO VISUAL */
        .top-accent-bar {
            height: 4px;
            background: linear-gradient(90deg, #1e1b4b 0%, #4338ca 40%, #059669 100%);
            border-radius: 4px;
            margin-bottom: 14px;
        }
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
        }
        .header-table td {
            vertical-align: top;
        }
        .logo-img {
            max-height: 65px;
            max-width: 250px;
            object-fit: contain;
            margin-bottom: 6px;
        }
        .company-title {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: -0.5px;
            line-height: 1.1;
        }
        .company-subtitle {
            font-size: 11px;
            font-weight: 700;
            color: #4338ca;
            margin-top: 2px;
            margin-bottom: 4px;
        }
        .company-info-text {
            font-size: 9.5px;
            color: #475569;
            line-height: 1.4;
        }
        .pill-badge {
            display: inline-block;
            background-color: #f1f5f9;
            color: #334155;
            font-size: 9px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            margin-top: 3px;
        }

        /* TARJETA OFICIAL DEL DOCUMENTO (DERECHA) */
        .doc-box {
            background: #f8fafc;
            border: 2px solid #312e81;
            border-radius: 10px;
            padding: 10px 14px;
            text-align: right;
            box-shadow: 0 2px 8px rgba(49, 46, 129, 0.05);
        }
        .doc-title {
            font-size: 10px;
            font-weight: 900;
            color: #312e81;
            letter-spacing: 1.2px;
            text-transform: uppercase;
        }
        .doc-num {
            font-size: 18px;
            font-weight: 900;
            color: #059669;
            font-family: monospace;
            margin: 3px 0;
            letter-spacing: 0.5px;
        }
        .badge-status {
            display: inline-block;
            background-color: #312e81;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 6px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-dates {
            font-size: 9px;
            color: #475569;
            margin-top: 8px;
            border-top: 1px solid #cbd5e1;
            padding-top: 6px;
            line-height: 1.5;
        }

        /* TARJETAS DE INFORMACIÓN (CLIENTE Y EQUIPO) */
        .grid-2 {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        .grid-2 td {
            width: 50%;
            vertical-align: top;
        }
        .card-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
        }
        .card-title {
            font-size: 9.5px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* SECCIONES Y TABLAS */
        .section-title {
            font-size: 10.5px;
            font-weight: 900;
            color: #0f172a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-left: 3px solid #4338ca;
            padding-left: 6px;
            margin-top: 14px;
            margin-bottom: 8px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .data-table th {
            background-color: #0f172a;
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 7px 8px;
            border: 1px solid #0f172a;
            text-align: left;
        }
        .data-table td {
            padding: 6px 8px;
            border: 1px solid #cbd5e1;
            font-size: 9.5px;
        }
        .data-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .totals-table {
            width: 250px;
            margin-left: auto;
            border-collapse: collapse;
            margin-top: 6px;
        }
        .totals-table td {
            padding: 4px 8px;
            font-size: 10px;
        }
        .totals-table tr.total-row {
            border-top: 2px solid #0f172a;
            font-weight: 900;
            font-size: 11.5px;
            background-color: #f1f5f9;
        }

        /* MATRIZ DE CONTROL DE CALIDAD (QC) */
        .qc-grid {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .qc-grid td {
            width: 33.33%;
            padding: 4px 8px;
            border: 1px solid #cbd5e1;
            background-color: #ffffff;
            font-size: 9px;
        }
        .badge-ok {
            background-color: #d1fae5;
            color: #065f46;
            font-weight: 800;
            font-size: 8px;
            padding: 1px 5px;
            border-radius: 3px;
            float: right;
        }
        .badge-fail {
            background-color: #ffe4e6;
            color: #9f1239;
            font-weight: 800;
            font-size: 8px;
            padding: 1px 5px;
            border-radius: 3px;
            float: right;
        }

        /* GALERÍA DE FOTOS */
        .photo-gallery {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 12px;
        }
        .photo-gallery td {
            width: 25%;
            padding: 3px;
            text-align: center;
            vertical-align: top;
        }
        .photo-box {
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3px;
            background-color: #f8fafc;
        }
        .photo-img {
            width: 100%;
            height: 85px;
            object-fit: cover;
            border-radius: 4px;
            background-color: #0f172a;
        }
        .photo-caption {
            font-size: 8px;
            font-weight: 700;
            color: #334155;
            margin-top: 3px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* FIRMAS Y PIE DE PÁGINA */
        .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            page-break-inside: avoid;
        }
        .signatures-table td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 25px;
        }
        .sig-line {
            border-top: 1.5px solid #0f172a;
            margin-top: 35px;
            padding-top: 4px;
            font-weight: 800;
            font-size: 10px;
            color: #0f172a;
        }
        .sig-sub {
            font-size: 8.5px;
            color: #64748b;
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

    <!-- BARRA SUPERIOR DE ACCIONES (SOLO EN NAVEGADOR WEB) -->
    <div class="print-btn-bar no-print">
        <div style="font-weight: 800; font-size: 13px; display: flex; items-center; gap: 8px;">
            📄 Reporte Técnico de Servicio — {{ $orden->numero_orden }}
        </div>
        @if(auth()->check())
            <button onclick="window.print()" class="btn-print">🖨️ Imprimir / Guardar PDF</button>
        @endif
    </div>

    <!-- LÍNEA SUPERIOR DE DISEÑO CORPORATIVO -->
    <div class="top-accent-bar"></div>

    <!-- 1. ENCABEZADO OFICIAL DE EMPRESA Y SUCURSAL -->
    <table class="header-table">
        <tr>
            <td style="padding-right: 15px;">
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

                <div class="company-subtitle">
                    {{ $empresa->nombre_comercial ?? $empresa->razon_social ?? 'Centro de Servicio Técnico Profesional' }}
                </div>

                <div class="company-info-text">
                    @if(!empty($empresa->documento))
                        <strong>Documento / Tax ID:</strong> {{ $empresa->documento }}<br>
                    @endif

                    @if(!empty($sucursal->nombre))
                        <span class="pill-badge">📍 Sucursal: {{ $sucursal->nombre }}</span><br>
                        <strong>Dirección:</strong> {{ $sucursal->direccion ?? $empresa->direccion ?? 'Principal' }}<br>
                        <strong>Contacto:</strong> 📞 {{ $sucursal->telefono ?? $empresa->telefono ?? 'N/A' }}
                    @else
                        <strong>Dirección:</strong> {{ $empresa->direccion ?? 'Dirección Principal' }}<br>
                        <strong>Contacto:</strong> 📞 {{ $empresa->telefono ?? 'N/A' }}
                    @endif
                    @if(!empty($empresa->email))
                        | ✉️ {{ $empresa->email }}
                    @endif
                </div>
            </td>

            <td style="width: 240px;">
                <div class="doc-box">
                    <div class="doc-title">Reporte Técnico Oficial</div>
                    <div class="doc-num">{{ $orden->numero_orden }}</div>
                    <div>
                        <span class="badge-status">{{ str_replace('_', ' ', $orden->estado_orden) }}</span>
                    </div>
                    <div class="doc-dates">
                        <strong>Fecha de Recepción:</strong> {{ \Carbon\Carbon::parse($orden->fecha_recepcion)->format('d/m/Y H:i') }}<br>
                        <strong>Fecha de Emisión:</strong> {{ $orden->fecha_entrega ? \Carbon\Carbon::parse($orden->fecha_entrega)->format('d/m/Y') : date('d/m/Y') }}<br>
                        <strong>Especialista Técnico:</strong> {{ $orden->tecnico->name ?? 'Taller de Servicio' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 2. INFORMACIÓN DEL CLIENTE Y DEL EQUIPO -->
    <table class="grid-2">
        <tr>
            <td style="padding-right: 6px;">
                <div class="card-box">
                    <div class="card-title">👤 Información del Cliente</div>
                    <div style="font-size: 11px; font-weight: 800; color: #0f172a;">{{ $orden->cliente->nombre ?? $orden->cliente_nombre }}</div>
                    <div style="font-size: 9.5px; color: #475569; margin-top: 2px;">
                        📞 <strong>Teléfono:</strong> {{ $orden->cliente->telefono ?? $orden->cliente_telefono ?? 'Sin número' }}<br>
                        @if(!empty($orden->cliente->email))
                            ✉️ <strong>Email:</strong> {{ $orden->cliente->email }}<br>
                        @endif
                        @if(!empty($orden->cliente->documento))
                            🆔 <strong>Doc. Identidad:</strong> {{ $orden->cliente->documento }}
                        @endif
                    </div>
                </div>
            </td>

            <td style="padding-left: 6px;">
                <div class="card-box">
                    <div class="card-title">📱 Especificaciones del Dispositivo</div>
                    <div style="font-size: 11px; font-weight: 800; color: #0f172a;">
                        {{ $orden->tipo_dispositivo }} {{ $orden->marca_nombre }} {{ $orden->modelo_nombre }}
                    </div>
                    <div style="font-size: 9.5px; color: #475569; margin-top: 2px;">
                        🎨 <strong>Color:</strong> {{ $orden->color ?? 'N/A' }} | 🔢 <strong>IMEI / Serie:</strong> {{ $orden->imei_serie ?? 'N/A' }}<br>
                        🔒 <strong>Seguridad:</strong> {{ !empty($orden->contrasena_patron) ? 'Clave / Patrón registrado' : 'Sin Contraseña' }}<br>
                        🎒 <strong>Accesorios Incluidos:</strong> {{ $orden->accesorios_incluidos ?? 'Sin accesorios adicionales' }}
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- 3. DIAGNÓSTICO INICIAL Y MOTIVO DE ATENCIÓN -->
    <div class="section-title">1. Diagnóstico Inicial & Falla Reportada</div>
    <div class="card-box" style="margin-bottom: 12px; background-color: #ffffff;">
        <p style="font-size: 10px; color: #0f172a;"><strong>Falla / Problema Indicado por el Cliente:</strong> {{ $orden->descripcion_falla }}</p>
        @if(!empty($orden->observaciones_fisicas))
            <p style="font-size: 9.5px; color: #475569; margin-top: 4px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
                <strong>Estado Físico de Recepción:</strong> {{ $orden->observaciones_fisicas }}
            </p>
        @endif
    </div>

    <!-- 4. DETALLE DE SERVICIOS Y REPUESTOS APLICADOS -->
    <div class="section-title">2. Trabajos Realizados & Repuestos Aplicados</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Descripción del Servicio / Repuesto</th>
                <th style="text-align: center; width: 55px;">Cant.</th>
                <th style="text-align: right; width: 90px;">Precio Unit.</th>
                <th style="text-align: right; width: 100px;">Subtotal</th>
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
                    <td colspan="4" style="text-align: center; font-style: italic; color: #64748b; padding: 10px;">
                        Servicio de diagnóstico y solución técnica especializada según presupuesto aceptado.
                    </td>
                </tr>
            @endif
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal / Estimado:</td>
            <td style="text-align: right; font-weight: bold;">{{ $currencySymbol }}{{ number_format($orden->costo_estimado ?? 0, 2) }}</td>
        </tr>
        <tr>
            <td style="color: #059669;">Anticipos Recibidos:</td>
            <td style="text-align: right; font-weight: bold; color: #059669;">-{{ $currencySymbol }}{{ number_format($orden->anticipo ?? 0, 2) }}</td>
        </tr>
        <tr class="total-row">
            <td>SALDO A CANCELAR:</td>
            <td style="text-align: right; color: #059669;">{{ $currencySymbol }}{{ number_format($orden->saldo_restante ?? 0, 2) }}</td>
        </tr>
    </table>

    <!-- 5. CHECKLIST DE CONTROL DE CALIDAD (QC) -->
    @php
        $postData = is_string($orden->post_servicio_json) ? json_decode($orden->post_servicio_json, true) : $orden->post_servicio_json;
        $validacionMap = $postData['validacion'] ?? [];
    @endphp

    @if(!empty($validacionMap) && count($validacionMap) > 0)
        <div class="section-title">3. Verificación de Control de Calidad (QC Pass - 24 Puntos)</div>
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
                                <span class="badge-fail">✗ Revisión</span>
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
            <strong style="color: #065f46;">Notas Finales del Especialista Técnico:</strong> {{ $postData['observaciones'] }}
        </div>
    @endif

    <!-- 6. EVIDENCIAS FOTOGRÁFICAS -->
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
        <div class="section-title">4. Galería de Evidencias Fotográficas de Taller ({{ count($fotosList) }} Imágenes)</div>
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
            <td colspan="2" style="font-size: 8.5px; color: #64748b; font-style: italic; text-align: center; padding-bottom: 12px;">
                El cliente declara recibir el dispositivo detallado en óptimas condiciones de funcionamiento tras haber realizado las pruebas correspondientes del servicio técnico. La garantía cubre exclusivamente las fallas e intervenciones detalladas en este reporte.
            </td>
        </tr>
        <tr>
            <td>
                <div class="sig-line">Firma de Conformidad del Cliente</div>
                <div class="sig-sub">{{ $orden->cliente->nombre ?? $orden->cliente_nombre }}</div>
                <div class="sig-sub">DNI / Doc: ___________________</div>
            </td>
            <td>
                <div class="sig-line">Firma y Sello del Técnico Responsable</div>
                <div class="sig-sub">{{ $orden->tecnico->name ?? 'Especialista de Taller' }}</div>
                <div class="sig-sub">{{ $empresa->nombre_comercial ?? 'Servitec' }}</div>
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
