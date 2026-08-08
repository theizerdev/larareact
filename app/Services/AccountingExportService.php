<?php

namespace App\Services;

use App\Models\ApunteContable;
use App\Models\AsientoContable;
use App\Models\Compra;
use App\Models\ConfiguracionContable;
use App\Models\CuentaContable;
use App\Models\Empresa;
use App\Models\Sale;
use ZipArchive;

class AccountingExportService
{
    /**
     * Generar un archivo Excel (.xlsx) completo con 10 pestañas contables, financieras y fiscales.
     */
    public function generateFullAccountingExcel(?int $empresaId, string $fromDate, string $toDate): string
    {
        $empresa = $empresaId ? Empresa::with('pais')->find($empresaId) : null;
        $nombreEmpresa = $empresa?->razon_social ?? 'Empresa';
        $docEmpresa = $empresa?->documento ?? '';
        $moneda = $empresa?->pais?->simbolo_moneda ?? 'Bs.';

        // Cargar Datos para cada libro
        $planCuentas = $this->getPlanCuentasData();
        $libroDiario = $this->getLibroDiarioData($fromDate, $toDate);
        $libroMayor = $this->getLibroMayorData($fromDate, $toDate);
        $balanceComprobacion = $this->getBalanceComprobacionData($fromDate, $toDate);
        $pnl = $this->getPNLData($empresaId, $fromDate, $toDate);
        $balanceGeneral = $this->getBalanceGeneralData($fromDate, $toDate, $pnl['utilidadNeta']);
        $ventasFiscales = $this->getVentasFiscalesData($empresa, $fromDate, $toDate);
        $comprasFiscales = $this->getComprasFiscalesData($empresa, $fromDate, $toDate);

        // Definición de las 10 Pestañas Consolidadas
        $sheets = [
            [
                'title' => 'Resumen Gerencial',
                'xml' => $this->buildDashboardSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $pnl, $balanceGeneral, $ventasFiscales, $comprasFiscales),
            ],
            [
                'title' => 'Plan de Cuentas',
                'xml' => $this->buildPlanCuentasSheet($nombreEmpresa, $docEmpresa, $planCuentas),
            ],
            [
                'title' => 'Libro Diario',
                'xml' => $this->buildLibroDiarioSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $libroDiario),
            ],
            [
                'title' => 'Libro Mayor',
                'xml' => $this->buildLibroMayorSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $libroMayor),
            ],
            [
                'title' => 'Balance Comprobacion',
                'xml' => $this->buildBalanceSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $balanceComprobacion),
            ],
            [
                'title' => 'Estado de Resultados PnL',
                'xml' => $this->buildPNLSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $pnl),
            ],
            [
                'title' => 'Balance General',
                'xml' => $this->buildBalanceGeneralSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $balanceGeneral),
            ],
            [
                'title' => 'Libro Ventas Fiscales',
                'xml' => $this->buildVentasFiscalesSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $ventasFiscales),
            ],
            [
                'title' => 'Libro Compras Fiscales',
                'xml' => $this->buildComprasFiscalesSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $comprasFiscales),
            ],
            [
                'title' => 'Liquidacion IVA e IGTF',
                'xml' => $this->buildLiquidacionIvaSheet($nombreEmpresa, $docEmpresa, $fromDate, $toDate, $moneda, $ventasFiscales, $comprasFiscales),
            ],
        ];

        // Crear el archivo ZIP (OpenXML .xlsx)
        $tempFile = tempnam(sys_get_temp_dir(), 'contabilidad_excel_') . '.xlsx';
        $zip = new ZipArchive();

        if ($zip->open($tempFile, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException("No se pudo crear el archivo Excel temporal.");
        }

        // 1. [Content_Types].xml
        $zip->addFromString('[Content_Types].xml', $this->getContentTypesXml(count($sheets)));

        // 2. _rels/.rels
        $zip->addFromString('_rels/.rels', $this->getRelsXml());

        // 3. xl/_rels/workbook.xml.rels
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->getWorkbookRelsXml(count($sheets)));

        // 4. xl/workbook.xml
        $zip->addFromString('xl/workbook.xml', $this->getWorkbookXml($sheets));

        // 5. xl/styles.xml
        $zip->addFromString('xl/styles.xml', $this->getStylesXml());

        // 6. xl/worksheets/sheet1.xml ... sheet10.xml
        foreach ($sheets as $index => $sheet) {
            $sheetNum = $index + 1;
            $zip->addFromString("xl/worksheets/sheet{$sheetNum}.xml", $sheet['xml']);
        }

        $zip->close();

        return $tempFile;
    }

    // ==========================================
    // DATA FETCHING METHODS
    // ==========================================

    private function getPlanCuentasData(): array
    {
        return CuentaContable::orderBy('codigo')
            ->get(['codigo', 'nombre', 'tipo', 'naturaleza', 'nivel', 'acepta_movimiento'])
            ->toArray();
    }

    private function getLibroDiarioData(string $fromDate, string $toDate): array
    {
        $asientos = AsientoContable::with(['apuntes.cuenta'])
            ->whereBetween('fecha', [$fromDate, $toDate])
            ->orderBy('fecha', 'asc')
            ->orderBy('numero_asiento', 'asc')
            ->get();

        $rows = [];
        foreach ($asientos as $asiento) {
            foreach ($asiento->apuntes as $apunte) {
                $rows[] = [
                    'numero_asiento' => $asiento->numero_asiento,
                    'fecha' => $asiento->fecha->format('Y-m-d'),
                    'glosa' => $asiento->glosa,
                    'codigo_cuenta' => $apunte->cuenta?->codigo ?? 'N/A',
                    'nombre_cuenta' => $apunte->cuenta?->nombre ?? 'Cuenta No Asignada',
                    'debe' => (float) $apunte->debe,
                    'haber' => (float) $apunte->haber,
                    'referencia' => $apunte->referencia ?? '',
                ];
            }
        }

        return $rows;
    }

    private function getLibroMayorData(string $fromDate, string $toDate): array
    {
        $cuentas = CuentaContable::where('acepta_movimiento', true)
            ->whereHas('apuntes', function ($q) use ($fromDate, $toDate) {
                $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));
            })
            ->orderBy('codigo')
            ->get();

        $result = [];
        foreach ($cuentas as $cuenta) {
            $apuntes = ApunteContable::where('cuenta_id', $cuenta->id)
                ->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]))
                ->with('asiento')
                ->get();

            $movs = [];
            $saldoAcumulado = 0;
            foreach ($apuntes as $ap) {
                $debe = (float) $ap->debe;
                $haber = (float) $ap->haber;
                if ($cuenta->naturaleza === 'deudora') {
                    $saldoAcumulado += ($debe - $haber);
                } else {
                    $saldoAcumulado += ($haber - $debe);
                }

                $movs[] = [
                    'fecha' => $ap->asiento?->fecha ? $ap->asiento->fecha->format('Y-m-d') : '',
                    'numero_asiento' => $ap->asiento?->numero_asiento ?? '',
                    'glosa' => $ap->asiento?->glosa ?? '',
                    'debe' => $debe,
                    'haber' => $haber,
                    'saldo' => $saldoAcumulado,
                ];
            }

            $result[] = [
                'codigo' => $cuenta->codigo,
                'nombre' => $cuenta->nombre,
                'naturaleza' => $cuenta->naturaleza,
                'movimientos' => $movs,
            ];
        }

        return $result;
    }

    private function getBalanceComprobacionData(string $fromDate, string $toDate): array
    {
        return CuentaContable::where('acepta_movimiento', true)
            ->withSum(['apuntes as total_debe' => function ($q) use ($fromDate, $toDate) {
                $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));
            }], 'debe')
            ->withSum(['apuntes as total_haber' => function ($q) use ($fromDate, $toDate) {
                $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));
            }], 'haber')
            ->orderBy('codigo')
            ->get()
            ->map(function ($c) {
                $debe = (float) ($c->total_debe ?? 0);
                $haber = (float) ($c->total_haber ?? 0);
                $saldoDeudor = 0;
                $saldoAcreedor = 0;

                if ($c->naturaleza === 'deudora') {
                    $neto = $debe - $haber;
                    if ($neto >= 0) {
                        $saldoDeudor = $neto;
                    } else {
                        $saldoAcreedor = abs($neto);
                    }
                } else {
                    $neto = $haber - $debe;
                    if ($neto >= 0) {
                        $saldoAcreedor = $neto;
                    } else {
                        $saldoDeudor = abs($neto);
                    }
                }

                return [
                    'codigo' => $c->codigo,
                    'nombre' => $c->nombre,
                    'tipo' => strtoupper($c->tipo),
                    'debe' => $debe,
                    'haber' => $haber,
                    'saldo_deudor' => $saldoDeudor,
                    'saldo_acreedor' => $saldoAcreedor,
                ];
            })
            ->filter(fn($c) => $c['debe'] > 0 || $c['haber'] > 0)
            ->values()
            ->toArray();
    }

    private function getPNLData(?int $empresaId, string $fromDate, string $toDate): array
    {
        $config = $empresaId ? ConfiguracionContable::where('empresa_id', $empresaId)->first() : null;

        $filterDates = fn($q) => $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));

        if ($config) {
            $ingresosProductos = (float) ApunteContable::where('cuenta_id', $config->cuenta_ventas_productos_id)->where($filterDates)->sum('haber');
            $ingresosServicios = (float) ApunteContable::where('cuenta_id', $config->cuenta_ventas_servicios_id)->where($filterDates)->sum('haber');
            $costoProductos = (float) ApunteContable::where('cuenta_id', $config->cuenta_costo_ventas_productos_id)->where($filterDates)->sum('debe');
            $costoRepuestos = (float) ApunteContable::where('cuenta_id', $config->cuenta_costo_repuestos_id)->where($filterDates)->sum('debe');
        } else {
            $ingresosProductos = 0; $ingresosServicios = 0; $costoProductos = 0; $costoRepuestos = 0;
        }

        if ($ingresosProductos == 0) {
            $ingresosProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '4.1.01%'))->where($filterDates)->sum('haber');
        }
        if ($ingresosServicios == 0) {
            $ingresosServicios = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '4.1.02%'))->where($filterDates)->sum('haber');
        }
        $totalIngresos = $ingresosProductos + $ingresosServicios;
        if ($totalIngresos == 0) {
            $ingresosProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'ingreso'))->where($filterDates)->sum('haber');
            $totalIngresos = $ingresosProductos;
        }

        if ($costoProductos == 0) {
            $costoProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '5.1.01%'))->where($filterDates)->sum('debe');
        }
        if ($costoRepuestos == 0) {
            $costoRepuestos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '5.1.02%'))->where($filterDates)->sum('debe');
        }
        $totalCostos = $costoProductos + $costoRepuestos;
        if ($totalCostos == 0) {
            $costoProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'costo'))->where($filterDates)->sum('debe');
            $totalCostos = $costoProductos;
        }

        $gastosGenerales = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'gasto'))->where($filterDates)->sum('debe');

        $utilidadBruta = $totalIngresos - $totalCostos;
        $utilidadNeta = $utilidadBruta - $gastosGenerales;

        return [
            'ingresosProductos' => $ingresosProductos,
            'ingresosServicios' => $ingresosServicios,
            'totalIngresos' => $totalIngresos,
            'costoProductos' => $costoProductos,
            'costoRepuestos' => $costoRepuestos,
            'totalCostos' => $totalCostos,
            'utilidadBruta' => $utilidadBruta,
            'gastosGenerales' => $gastosGenerales,
            'utilidadNeta' => $utilidadNeta,
        ];
    }

    private function getBalanceGeneralData(string $fromDate, string $toDate, float $utilidadNeta): array
    {
        $cuentas = CuentaContable::where('acepta_movimiento', true)
            ->withSum(['apuntes as total_debe' => function ($q) use ($fromDate, $toDate) {
                $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));
            }], 'debe')
            ->withSum(['apuntes as total_haber' => function ($q) use ($fromDate, $toDate) {
                $q->whereHas('asiento', fn($sq) => $sq->whereBetween('fecha', [$fromDate, $toDate]));
            }], 'haber')
            ->orderBy('codigo')
            ->get();

        $activos = [];
        $pasivos = [];
        $patrimonio = [];

        foreach ($cuentas as $c) {
            $debe = (float) ($c->total_debe ?? 0);
            $haber = (float) ($c->total_haber ?? 0);

            if ($debe == 0 && $haber == 0) continue;

            if ($c->tipo === 'activo') {
                $saldo = $debe - $haber;
                if ($saldo != 0) {
                    $activos[] = ['codigo' => $c->codigo, 'nombre' => $c->nombre, 'saldo' => $saldo];
                }
            } elseif ($c->tipo === 'pasivo') {
                $saldo = $haber - $debe;
                if ($saldo != 0) {
                    $pasivos[] = ['codigo' => $c->codigo, 'nombre' => $c->nombre, 'saldo' => $saldo];
                }
            } elseif ($c->tipo === 'patrimonio') {
                $saldo = $haber - $debe;
                if ($saldo != 0) {
                    $patrimonio[] = ['codigo' => $c->codigo, 'nombre' => $c->nombre, 'saldo' => $saldo];
                }
            }
        }

        $totalActivos = array_sum(array_column($activos, 'saldo'));
        $totalPasivos = array_sum(array_column($pasivos, 'saldo'));
        $totalPatrimonioCuentas = array_sum(array_column($patrimonio, 'saldo'));
        $totalPatrimonio = $totalPatrimonioCuentas + $utilidadNeta;
        $totalPasivoMasPatrimonio = $totalPasivos + $totalPatrimonio;

        return [
            'activos' => $activos,
            'pasivos' => $pasivos,
            'patrimonio' => $patrimonio,
            'totalActivos' => $totalActivos,
            'totalPasivos' => $totalPasivos,
            'totalPatrimonioCuentas' => $totalPatrimonioCuentas,
            'utilidadNeta' => $utilidadNeta,
            'totalPatrimonio' => $totalPatrimonio,
            'totalPasivoMasPatrimonio' => $totalPasivoMasPatrimonio,
            'isEquilibrado' => abs($totalActivos - $totalPasivoMasPatrimonio) < 0.01,
        ];
    }

    private function getVentasFiscalesData(?Empresa $empresa, string $fromDate, string $toDate): array
    {
        $query = Sale::with(['cliente', 'user'])
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);

        if ($empresa?->id) {
            $query->where('empresa_id', $empresa->id);
        }

        $tasaPais = (float) ($empresa?->pais?->impuesto_predeterminado ?? 16.00);

        return $query->orderBy('created_at', 'asc')->get()->map(function ($sale) use ($tasaPais) {
            $total = (float) $sale->total;
            $subtotal = (float) ($sale->subtotal ?? 0);

            if ($sale->impuesto > 0) {
                $taxAmount = (float) $sale->impuesto;
            } elseif ($subtotal > 0 && $subtotal < $total) {
                $taxAmount = $total - $subtotal;
            } else {
                $taxAmount = round(($total * $tasaPais) / (100 + $tasaPais), 2);
                $subtotal = $total - $taxAmount;
            }

            $igtfAmount = (float) ($sale->igtf_amount ?? 0);

            return [
                'factura' => $sale->codigo_ticket ?? $sale->invoice_number ?? ('FAC-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT)),
                'control' => $sale->control_number ?? ('00-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT)),
                'fecha' => $sale->created_at->format('Y-m-d'),
                'cliente' => $sale->cliente_nombre ?? $sale->cliente?->razon_social ?? $sale->cliente?->nombre ?? 'Cliente Contado',
                'rif' => $sale->cliente?->documento ?? 'J-000000000',
                'base' => $subtotal,
                'aliquota' => $subtotal > 0 ? round(($taxAmount / $subtotal) * 100, 1) : $tasaPais,
                'iva' => $taxAmount,
                'exento' => $taxAmount == 0 ? $total : 0,
                'igtf' => $igtfAmount,
                'total' => $total,
            ];
        })->toArray();
    }

    private function getComprasFiscalesData(?Empresa $empresa, string $fromDate, string $toDate): array
    {
        $query = Compra::with(['proveedor', 'user'])
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);

        if ($empresa?->id) {
            $query->where('empresa_id', $empresa->id);
        }

        $tasaPais = (float) ($empresa?->pais?->impuesto_predeterminado ?? 16.00);

        return $query->orderBy('created_at', 'asc')->get()->map(function ($compra) use ($tasaPais) {
            $total = (float) $compra->total;
            $subtotal = (float) ($compra->subtotal ?? 0);

            if ($compra->impuesto > 0) {
                $taxAmount = (float) $compra->impuesto;
            } elseif ($subtotal > 0 && $subtotal < $total) {
                $taxAmount = $total - $subtotal;
            } else {
                $taxAmount = round(($total * $tasaPais) / (100 + $tasaPais), 2);
                $subtotal = $total - $taxAmount;
            }

            return [
                'factura' => $compra->numero_factura ?? ('COM-' . str_pad($compra->id, 6, '0', STR_PAD_LEFT)),
                'control' => $compra->numero_control ?? ('00-' . str_pad($compra->id, 6, '0', STR_PAD_LEFT)),
                'fecha' => $compra->created_at->format('Y-m-d'),
                'proveedor' => $compra->proveedor?->razon_social ?? $compra->proveedor?->nombre_comercial ?? 'Proveedor',
                'rif' => $compra->proveedor?->rif_documento ?? $compra->proveedor?->documento ?? 'J-000000000',
                'base' => $subtotal,
                'iva' => $taxAmount,
                'total' => $total,
            ];
        })->toArray();
    }

    // ==========================================
    // WORKSHEET BUILDERS
    // ==========================================

    private function buildDashboardSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $pnl, array $bg, array $ventas, array $compras): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "SISTEMA CONTABLE - DASHBOARD Y RESUMEN GERENCIAL", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Identificación: {$doc} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Indicador Financiero / KPI', 'Valor en Moneda (' . $moneda . ')', 'Estado / Observación'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        // KPIs
        $rows[] = $this->makeRow($r++, [['val' => 'Total Ingresos Operacionales (Ventas)', 'style' => 6], ['val' => $pnl['totalIngresos'], 'style' => 4, 'type' => 'number'], ['val' => 'Facturación Total Bruta', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => 'Total Costos de Venta (Productos/Repuestos)', 'style' => 0], ['val' => $pnl['totalCostos'], 'style' => 4, 'type' => 'number'], ['val' => 'Costo Directo de Mercadería', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => 'Utilidad Bruta en Ventas', 'style' => 6], ['val' => $pnl['utilidadBruta'], 'style' => 4, 'type' => 'number'], ['val' => 'Margen Bruto de Operación', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => 'Gastos Operativos y Administrativos', 'style' => 0], ['val' => $pnl['gastosGenerales'], 'style' => 4, 'type' => 'number'], ['val' => 'Servicios, Alquileres y Gastos', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => 'UTILIDAD / PÉRDIDA NETA DEL EJERCICIO', 'style' => 5], ['val' => $pnl['utilidadNeta'], 'style' => 5, 'type' => 'number'], ['val' => $pnl['utilidadNeta'] >= 0 ? 'GANANCIA NETA (+)' : 'PÉRDIDA NETA (-)', 'style' => 5]]);
        $rows[] = $this->makeRow($r++, []);

        // Balance Kpis
        $rows[] = $this->makeRow($r++, [['val' => 'ESTADO DE SITUACIÓN FINANCIERA (BALANCE GENERAL)', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  (+) Total Activos Registrados', 'style' => 0], ['val' => $bg['totalActivos'], 'style' => 4, 'type' => 'number'], ['val' => 'Bienes, Caja, Bancos e Inventario', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  (-) Total Pasivos Registrados', 'style' => 0], ['val' => $bg['totalPasivos'], 'style' => 4, 'type' => 'number'], ['val' => 'Deudas y Cuentas por Pagar', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  (=) Total Patrimonio (Incluye Resultado)', 'style' => 0], ['val' => $bg['totalPatrimonio'], 'style' => 4, 'type' => 'number'], ['val' => 'Capital Social + Utilidad Acumulada', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => 'Ecuación Patrimonial (Activo - Pasivo - Patrimonio)', 'style' => 5], ['val' => round($bg['totalActivos'] - $bg['totalPasivoMasPatrimonio'], 2), 'style' => 5, 'type' => 'number'], ['val' => $bg['isEquilibrado'] ? 'ECUACIÓN PERFECTAMENTE CUADRADA' : 'REVISAR DESBALANCE', 'style' => 5]]);
        $rows[] = $this->makeRow($r++, []);

        // Tax Kpis
        $totalIvaVentas = array_sum(array_column($ventas, 'iva'));
        $totalIvaCompras = array_sum(array_column($compras, 'iva'));
        $totalIgtf = array_sum(array_column($ventas, 'igtf'));
        $netoIva = $totalIvaVentas - $totalIvaCompras;

        $rows[] = $this->makeRow($r++, [['val' => 'RESUMEN TRIBUTARIO FISCAL', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  Débito Fiscal (IVA Ventas)', 'style' => 0], ['val' => $totalIvaVentas, 'style' => 4, 'type' => 'number'], ['val' => 'IVA Generado por Ventas', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  Crédito Fiscal (IVA Compras)', 'style' => 0], ['val' => $totalIvaCompras, 'style' => 4, 'type' => 'number'], ['val' => 'IVA Soportado en Compras', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  Saldo Neto de IVA', 'style' => 6], ['val' => $netoIva, 'style' => 4, 'type' => 'number'], ['val' => $netoIva > 0 ? 'IVA a Pagar' : 'Crédito a Favor Próximo Mes', 'style' => 0]]);
        $rows[] = $this->makeRow($r++, [['val' => '  Monto IGTF Retenido/Recabado', 'style' => 0], ['val' => $totalIgtf, 'style' => 4, 'type' => 'number'], ['val' => 'Impuesto IGTF en Divisas', 'style' => 0]]);

        $colWidths = [45, 25, 38];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildPlanCuentasSheet(string $empresa, string $doc, array $cuentas): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "SISTEMA CONTABLE - PLAN DE CUENTAS", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} " . ($doc ? "({$doc})" : ''), 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Código Cuenta', 'Nombre de la Cuenta', 'Tipo', 'Naturaleza', 'Nivel', 'Acepta Movimiento'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        foreach ($cuentas as $c) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $c['codigo'], 'style' => 6],
                ['val' => $c['nombre'], 'style' => 0],
                ['val' => strtoupper($c['tipo']), 'style' => 0],
                ['val' => ucfirst($c['naturaleza']), 'style' => 0],
                ['val' => (int) $c['nivel'], 'style' => 0, 'type' => 'number'],
                ['val' => $c['acepta_movimiento'] ? 'SÍ' : 'NO', 'style' => 0],
            ]);
        }

        $colWidths = [18, 45, 16, 16, 10, 20];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildLibroDiarioSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $entries): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "SISTEMA CONTABLE - LIBRO DIARIO GENERAL", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Asiento N°', 'Fecha', 'Glosa / Concepto', 'Código Cuenta', 'Nombre Cuenta', 'Debe (' . $moneda . ')', 'Haber (' . $moneda . ')', 'Referencia'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        $startDataRow = $r;
        foreach ($entries as $e) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $e['numero_asiento'], 'style' => 6],
                ['val' => $e['fecha'], 'style' => 7],
                ['val' => $e['glosa'], 'style' => 0],
                ['val' => $e['codigo_cuenta'], 'style' => 6],
                ['val' => $e['nombre_cuenta'], 'style' => 0],
                ['val' => $e['debe'], 'style' => 4, 'type' => 'number'],
                ['val' => $e['haber'], 'style' => 4, 'type' => 'number'],
                ['val' => $e['referencia'], 'style' => 0],
            ]);
        }
        $endDataRow = $r - 1;

        if ($endDataRow >= $startDataRow) {
            $rows[] = $this->makeRow($r++, [
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => 'TOTALES ASENTADOS', 'style' => 5],
                ['val' => "SUM(F{$startDataRow}:F{$endDataRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(G{$startDataRow}:G{$endDataRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => '', 'style' => 5],
            ]);
        }

        $colWidths = [15, 14, 38, 16, 32, 18, 18, 18];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildLibroMayorSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $cuentasMayor): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "SISTEMA CONTABLE - LIBRO MAYOR DE CUENTAS", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Código', 'Cuenta Contable', 'Fecha', 'Asiento N°', 'Glosa / Explicación', 'Debe (' . $moneda . ')', 'Haber (' . $moneda . ')', 'Saldo Acumulado (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        foreach ($cuentasMayor as $c) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $c['codigo'], 'style' => 6],
                ['val' => "{$c['nombre']} (" . strtoupper($c['naturaleza']) . ")", 'style' => 6],
                ['val' => '', 'style' => 6],
                ['val' => '', 'style' => 6],
                ['val' => '', 'style' => 6],
                ['val' => '', 'style' => 6],
                ['val' => '', 'style' => 6],
                ['val' => '', 'style' => 6],
            ]);

            $startRow = $r;
            foreach ($c['movimientos'] as $m) {
                $rows[] = $this->makeRow($r++, [
                    ['val' => '', 'style' => 0],
                    ['val' => '', 'style' => 0],
                    ['val' => $m['fecha'], 'style' => 7],
                    ['val' => $m['numero_asiento'], 'style' => 0],
                    ['val' => $m['glosa'], 'style' => 0],
                    ['val' => $m['debe'], 'style' => 4, 'type' => 'number'],
                    ['val' => $m['haber'], 'style' => 4, 'type' => 'number'],
                    ['val' => $m['saldo'], 'style' => 4, 'type' => 'number'],
                ]);
            }
            $endRow = $r - 1;

            if ($endRow >= $startRow) {
                $rows[] = $this->makeRow($r++, [
                    ['val' => '', 'style' => 5],
                    ['val' => 'TOTAL CUENTA ' . $c['codigo'], 'style' => 5],
                    ['val' => '', 'style' => 5],
                    ['val' => '', 'style' => 5],
                    ['val' => '', 'style' => 5],
                    ['val' => "SUM(F{$startRow}:F{$endRow})", 'style' => 5, 'type' => 'formula'],
                    ['val' => "SUM(G{$startRow}:G{$endRow})", 'style' => 5, 'type' => 'formula'],
                    ['val' => "H{$endRow}", 'style' => 5, 'type' => 'formula'],
                ]);
            }
            $rows[] = $this->makeRow($r++, []);
        }

        $colWidths = [16, 32, 14, 15, 38, 18, 18, 20];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildBalanceSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $data): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "BALANCE DE COMPROBACIÓN DE SUMAS Y SALDOS", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Código', 'Cuenta Contable', 'Tipo', 'Suma Debe', 'Suma Haber', 'Saldo Deudor', 'Saldo Acreedor'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        $startRow = $r;
        foreach ($data as $item) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $item['codigo'], 'style' => 6],
                ['val' => $item['nombre'], 'style' => 0],
                ['val' => $item['tipo'], 'style' => 0],
                ['val' => $item['debe'], 'style' => 4, 'type' => 'number'],
                ['val' => $item['haber'], 'style' => 4, 'type' => 'number'],
                ['val' => $item['saldo_deudor'], 'style' => 4, 'type' => 'number'],
                ['val' => $item['saldo_acreedor'], 'style' => 4, 'type' => 'number'],
            ]);
        }
        $endRow = $r - 1;

        if ($endRow >= $startRow) {
            $rows[] = $this->makeRow($r++, [
                ['val' => '', 'style' => 5],
                ['val' => 'SUMAS Y SALDOS TOTALES', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => "SUM(D{$startRow}:D{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(E{$startRow}:E{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(F{$startRow}:F{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(G{$startRow}:G{$endRow})", 'style' => 5, 'type' => 'formula'],
            ]);
        }

        $colWidths = [16, 38, 14, 18, 18, 18, 18];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildPNLSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $pnl): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "ESTADO DE RESULTADOS (PROFIT & LOSS - GANANCIAS Y PÉRDIDAS)", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Concepto / Rubro Financiero', 'Monto Parcial (' . $moneda . ')', 'Total Sub-Rubro (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        // 1. INGRESOS
        $rows[] = $this->makeRow($r++, [['val' => '1. INGRESOS OPERACIONALES', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rIngProd = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (+) Ventas de Productos / Mercadería', 'style' => 0], ['val' => $pnl['ingresosProductos'], 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rIngServ = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (+) Ventas de Servicios / Servicio Técnico', 'style' => 0], ['val' => $pnl['ingresosServicios'], 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rTotalIng = $r;
        $rows[] = $this->makeRow($r++, [['val' => 'TOTAL INGRESOS BRUTOS', 'style' => 6], ['val' => '', 'style' => 0], ['val' => "SUM(B{$rIngProd}:B{$rIngServ})", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 2. COSTOS DE VENTA
        $rows[] = $this->makeRow($r++, [['val' => '2. COSTOS DE VENTA', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rCostProd = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (-) Costo de Ventas de Productos', 'style' => 0], ['val' => $pnl['costoProductos'], 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rCostRep = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (-) Costo de Repuestos / Materiales', 'style' => 0], ['val' => $pnl['costoRepuestos'], 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rTotalCost = $r;
        $rows[] = $this->makeRow($r++, [['val' => 'TOTAL COSTOS DE VENTA', 'style' => 6], ['val' => '', 'style' => 0], ['val' => "SUM(B{$rCostProd}:B{$rCostRep})", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 3. UTILIDAD BRUTA
        $rUtBruta = $r;
        $rows[] = $this->makeRow($r++, [['val' => '3. UTILIDAD BRUTA EN VENTAS', 'style' => 5], ['val' => '', 'style' => 5], ['val' => "C{$rTotalIng}-C{$rTotalCost}", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 4. GASTOS OPERATIVOS
        $rows[] = $this->makeRow($r++, [['val' => '4. GASTOS OPERATIVOS Y ADMINISTRATIVOS', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rGastos = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (-) Gastos Generales, Servicios y Alquileres', 'style' => 0], ['val' => $pnl['gastosGenerales'], 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rTotalGastos = $r;
        $rows[] = $this->makeRow($r++, [['val' => 'TOTAL GASTOS OPERATIVOS', 'style' => 6], ['val' => '', 'style' => 0], ['val' => "B{$rGastos}", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 5. UTILIDAD NETA
        $rows[] = $this->makeRow($r++, [['val' => '5. UTILIDAD / PÉRDIDA NETA DEL EJERCICIO', 'style' => 5], ['val' => '', 'style' => 5], ['val' => "C{$rUtBruta}-C{$rTotalGastos}", 'style' => 5, 'type' => 'formula']]);

        $colWidths = [48, 25, 25];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildBalanceGeneralSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $bg): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Código', 'Cuenta / Rubro Patrimonial', 'Saldo en ' . $moneda, 'Total Grupo (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        // 1. ACTIVOS
        $rows[] = $this->makeRow($r++, [['val' => '1. ACTIVOS (BIENES Y DERECHOS)', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $startActivos = $r;
        foreach ($bg['activos'] as $act) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $act['codigo'], 'style' => 6],
                ['val' => $act['nombre'], 'style' => 0],
                ['val' => $act['saldo'], 'style' => 4, 'type' => 'number'],
                ['val' => '', 'style' => 0],
            ]);
        }
        $endActivos = $r - 1;
        $rTotalAct = $r;
        $sumActivos = ($endActivos >= $startActivos) ? "SUM(C{$startActivos}:C{$endActivos})" : "0";
        $rows[] = $this->makeRow($r++, [
            ['val' => '', 'style' => 5],
            ['val' => 'TOTAL ACTIVOS', 'style' => 5],
            ['val' => '', 'style' => 5],
            ['val' => $sumActivos, 'style' => 5, 'type' => 'formula'],
        ]);
        $rows[] = $this->makeRow($r++, []);

        // 2. PASIVOS
        $rows[] = $this->makeRow($r++, [['val' => '2. PASIVOS (OBLIGACIONES Y DEUDAS)', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $startPasivos = $r;
        foreach ($bg['pasivos'] as $pas) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $pas['codigo'], 'style' => 6],
                ['val' => $pas['nombre'], 'style' => 0],
                ['val' => $pas['saldo'], 'style' => 4, 'type' => 'number'],
                ['val' => '', 'style' => 0],
            ]);
        }
        $endPasivos = $r - 1;
        $rTotalPas = $r;
        $sumPasivos = ($endPasivos >= $startPasivos) ? "SUM(C{$startPasivos}:C{$endPasivos})" : "0";
        $rows[] = $this->makeRow($r++, [
            ['val' => '', 'style' => 5],
            ['val' => 'TOTAL PASIVOS', 'style' => 5],
            ['val' => '', 'style' => 5],
            ['val' => $sumPasivos, 'style' => 5, 'type' => 'formula'],
        ]);
        $rows[] = $this->makeRow($r++, []);

        // 3. PATRIMONIO
        $rows[] = $this->makeRow($r++, [['val' => '3. PATRIMONIO NETO Y CAPITAL', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $startPat = $r;
        foreach ($bg['patrimonio'] as $pat) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $pat['codigo'], 'style' => 6],
                ['val' => $pat['nombre'], 'style' => 0],
                ['val' => $pat['saldo'], 'style' => 4, 'type' => 'number'],
                ['val' => '', 'style' => 0],
            ]);
        }
        $endPat = $r - 1;
        $rResult = $r;
        $rows[] = $this->makeRow($r++, [
            ['val' => '3.99', 'style' => 6],
            ['val' => 'Utilidad / Pérdida Neta del Ejercicio (P&L)', 'style' => 8],
            ['val' => $bg['utilidadNeta'], 'style' => 4, 'type' => 'number'],
            ['val' => '', 'style' => 0],
        ]);

        $rTotalPat = $r;
        $sumPatrimonio = ($endPat >= $startPat) ? "SUM(C{$startPat}:C{$rResult})" : "C{$rResult}";
        $rows[] = $this->makeRow($r++, [
            ['val' => '', 'style' => 5],
            ['val' => 'TOTAL PATRIMONIO', 'style' => 5],
            ['val' => '', 'style' => 5],
            ['val' => $sumPatrimonio, 'style' => 5, 'type' => 'formula'],
        ]);
        $rows[] = $this->makeRow($r++, []);

        // TOTAL PASIVO + PATRIMONIO
        $rTotalPasPat = $r;
        $rows[] = $this->makeRow($r++, [
            ['val' => '', 'style' => 5],
            ['val' => 'TOTAL PASIVO + PATRIMONIO', 'style' => 5],
            ['val' => '', 'style' => 5],
            ['val' => "D{$rTotalPas}+D{$rTotalPat}", 'style' => 5, 'type' => 'formula'],
        ]);

        // VERIFICACIÓN ECUACIÓN
        $rows[] = $this->makeRow($r++, [
            ['val' => '', 'style' => 5],
            ['val' => 'ECUACIÓN CONTABLE (ACTIVO - (PASIVO + PATRIMONIO))', 'style' => 5],
            ['val' => '', 'style' => 5],
            ['val' => "D{$rTotalAct}-D{$rTotalPasPat}", 'style' => 5, 'type' => 'formula'],
        ]);

        $colWidths = [16, 42, 22, 25];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildVentasFiscalesSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $ventas): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "LIBRO FISCAL DE VENTAS (IVA / IGTF)", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | RIF: {$doc} | Periodo: {$from} al {$to}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['N° Factura', 'N° Control', 'Fecha', 'RIF / CI Cliente', 'Cliente / Razón Social', 'Base Imponible (' . $moneda . ')', 'Alícuota %', 'Monto IVA (' . $moneda . ')', 'Monto Exento (' . $moneda . ')', 'IGTF (' . $moneda . ')', 'Total Facturado (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        $startRow = $r;
        foreach ($ventas as $v) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $v['factura'], 'style' => 6],
                ['val' => $v['control'], 'style' => 0],
                ['val' => $v['fecha'], 'style' => 7],
                ['val' => $v['rif'], 'style' => 0],
                ['val' => $v['cliente'], 'style' => 0],
                ['val' => $v['base'], 'style' => 4, 'type' => 'number'],
                ['val' => $v['aliquota'], 'style' => 4, 'type' => 'number'],
                ['val' => $v['iva'], 'style' => 4, 'type' => 'number'],
                ['val' => $v['exento'], 'style' => 4, 'type' => 'number'],
                ['val' => $v['igtf'], 'style' => 4, 'type' => 'number'],
                ['val' => $v['total'], 'style' => 4, 'type' => 'number'],
            ]);
        }
        $endRow = $r - 1;

        if ($endRow >= $startRow) {
            $rows[] = $this->makeRow($r++, [
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => 'TOTALES LIBRO DE VENTAS', 'style' => 5],
                ['val' => "SUM(F{$startRow}:F{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => '', 'style' => 5],
                ['val' => "SUM(H{$startRow}:H{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(I{$startRow}:I{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(J{$startRow}:J{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(K{$startRow}:K{$endRow})", 'style' => 5, 'type' => 'formula'],
            ]);
        }

        $colWidths = [16, 16, 14, 18, 35, 18, 12, 18, 18, 16, 20];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildComprasFiscalesSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $compras): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "LIBRO FISCAL DE COMPRAS", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | RIF: {$doc} | Periodo: {$from} al {$to}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['N° Factura', 'N° Control', 'Fecha', 'RIF / CI Proveedor', 'Proveedor / Razón Social', 'Base Imponible (' . $moneda . ')', 'Crédito IVA (' . $moneda . ')', 'Total Compra (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        $startRow = $r;
        foreach ($compras as $c) {
            $rows[] = $this->makeRow($r++, [
                ['val' => $c['factura'], 'style' => 6],
                ['val' => $c['control'], 'style' => 0],
                ['val' => $c['fecha'], 'style' => 7],
                ['val' => $c['rif'], 'style' => 0],
                ['val' => $c['proveedor'], 'style' => 0],
                ['val' => $c['base'], 'style' => 4, 'type' => 'number'],
                ['val' => $c['iva'], 'style' => 4, 'type' => 'number'],
                ['val' => $c['total'], 'style' => 4, 'type' => 'number'],
            ]);
        }
        $endRow = $r - 1;

        if ($endRow >= $startRow) {
            $rows[] = $this->makeRow($r++, [
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => '', 'style' => 5],
                ['val' => 'TOTALES LIBRO DE COMPRAS', 'style' => 5],
                ['val' => "SUM(F{$startRow}:F{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(G{$startRow}:G{$endRow})", 'style' => 5, 'type' => 'formula'],
                ['val' => "SUM(H{$startRow}:H{$endRow})", 'style' => 5, 'type' => 'formula'],
            ]);
        }

        $colWidths = [16, 16, 14, 18, 35, 18, 18, 20];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    private function buildLiquidacionIvaSheet(string $empresa, string $doc, string $from, string $to, string $moneda, array $ventas, array $compras): string
    {
        $rows = [];
        $r = 1;

        $rows[] = $this->makeRow($r++, [['val' => "LIQUIDACIÓN TRIBUTARIA IVA E IGTF DEL PERIODO", 'style' => 1]]);
        $rows[] = $this->makeRow($r++, [['val' => "Empresa: {$empresa} | RIF: {$doc} | Periodo: {$from} al {$to} | Moneda: {$moneda}", 'style' => 2]]);
        $rows[] = $this->makeRow($r++, []);

        $headers = ['Concepto Fiscal / Rubro Tributario', 'Monto Parcial (' . $moneda . ')', 'Total Fiscal (' . $moneda . ')'];
        $rows[] = $this->makeRow($r++, array_map(fn($h) => ['val' => $h, 'style' => 3], $headers));

        $totalDebitoIva = array_sum(array_column($ventas, 'iva'));
        $totalCreditoIva = array_sum(array_column($compras, 'iva'));
        $totalIgtf = array_sum(array_column($ventas, 'igtf'));
        $saldoNetoIva = $totalDebitoIva - $totalCreditoIva;

        // 1. IVA
        $rows[] = $this->makeRow($r++, [['val' => '1. DETERMINACIÓN DEL IMPUESTO AL VALOR AGREGADO (IVA)', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rDeb = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (+) Total Débito Fiscal (IVA Ventas del Periodo)', 'style' => 0], ['val' => $totalDebitoIva, 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rCred = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (-) Total Crédito Fiscal (IVA Compras del Periodo)', 'style' => 0], ['val' => $totalCreditoIva, 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rNetoIva = $r;
        $rows[] = $this->makeRow($r++, [['val' => 'SALDO NETO DE IVA DEL PERIODO', 'style' => 5], ['val' => '', 'style' => 5], ['val' => "B{$rDeb}-B{$rCred}", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 2. IGTF
        $rows[] = $this->makeRow($r++, [['val' => '2. IMPUESTO A LAS GRANDES TRANSACCIONES FINANCIERA (IGTF)', 'style' => 6], ['val' => '', 'style' => 0], ['val' => '', 'style' => 0]]);
        $rIgtf = $r;
        $rows[] = $this->makeRow($r++, [['val' => '  (+) Total IGTF Percibido / Cobrado en Ventas', 'style' => 0], ['val' => $totalIgtf, 'style' => 4, 'type' => 'number'], ['val' => '', 'style' => 0]]);
        $rTotalIgtf = $r;
        $rows[] = $this->makeRow($r++, [['val' => 'TOTAL COMPROMISO IGTF PERCIBIDO', 'style' => 5], ['val' => '', 'style' => 5], ['val' => "B{$rIgtf}", 'style' => 5, 'type' => 'formula']]);
        $rows[] = $this->makeRow($r++, []);

        // 3. COMPROMISO TOTAL ESTIMADO
        $rows[] = $this->makeRow($r++, [['val' => '3. TOTAL ESTIMADO A DECLARAR / APORTAR AL SENIAT', 'style' => 5], ['val' => '', 'style' => 5], ['val' => "MAX(0, C{$rNetoIva}) + C{$rTotalIgtf}", 'style' => 5, 'type' => 'formula']]);

        $colWidths = [50, 25, 25];
        return $this->assembleSheetXml($rows, $colWidths);
    }

    // ==========================================
    // XML HELPERS & STRUCTURE GENERATOR
    // ==========================================

    private function makeRow(int $rowIndex, array $cells): string
    {
        if (empty($cells)) {
            return "<row r=\"{$rowIndex}\"/>";
        }

        $xml = "<row r=\"{$rowIndex}\">";
        $colIndex = 0;

        foreach ($cells as $cell) {
            $colLetter = $this->getColLetter($colIndex++);
            $cellRef = "{$colLetter}{$rowIndex}";
            $style = $cell['style'] ?? 0;
            $type = $cell['type'] ?? 'string';
            $val = $cell['val'] ?? '';

            if ($type === 'formula') {
                $xml .= "<c r=\"{$cellRef}\" s=\"{$style}\"><f>{$val}</f></c>";
            } elseif ($type === 'number') {
                $numVal = is_numeric($val) ? (float) $val : 0;
                $xml .= "<c r=\"{$cellRef}\" s=\"{$style}\"><v>{$numVal}</v></c>";
            } else {
                $escapedVal = htmlspecialchars((string) $val, ENT_XML1, 'UTF-8');
                $xml .= "<c r=\"{$cellRef}\" t=\"inlineStr\" s=\"{$style}\"><is><t>{$escapedVal}</t></is></c>";
            }
        }

        $xml .= "</row>";
        return $xml;
    }

    private function getColLetter(int $colIndex): string
    {
        $letter = '';
        while ($colIndex >= 0) {
            $letter = chr(($colIndex % 26) + 65) . $letter;
            $colIndex = intdiv($colIndex, 26) - 1;
        }
        return $letter;
    }

    private function assembleSheetXml(array $rows, array $colWidths): string
    {
        $colsXml = '<cols>';
        foreach ($colWidths as $idx => $width) {
            $colNum = $idx + 1;
            $colsXml .= "<col min=\"{$colNum}\" max=\"{$colNum}\" width=\"{$width}\" customWidth=\"1\"/>";
        }
        $colsXml .= '</cols>';

        $sheetData = implode('', $rows);

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  {$colsXml}
  <sheetData>
    {$sheetData}
  </sheetData>
</worksheet>
XML;
    }

    private function getContentTypesXml(int $sheetCount): string
    {
        $overrides = '';
        for ($i = 1; $i <= $sheetCount; $i++) {
            $overrides .= "<Override PartName=\"/xl/worksheets/sheet{$i}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/>\n";
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  {$overrides}
</Types>
XML;
    }

    private function getRelsXml(): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
XML;
    }

    private function getWorkbookRelsXml(int $sheetCount): string
    {
        $rels = "<Relationship Id=\"rIdStyles\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles\" Target=\"styles.xml\"/>\n";
        for ($i = 1; $i <= $sheetCount; $i++) {
            $relId = "rId{$i}";
            $rels .= "<Relationship Id=\"{$relId}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet{$i}.xml\"/>\n";
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  {$rels}
</Relationships>
XML;
    }

    private function getWorkbookXml(array $sheets): string
    {
        $sheetsXml = '';
        foreach ($sheets as $index => $sheet) {
            $sheetNum = $index + 1;
            $relId = "rId{$sheetNum}";
            $escapedName = htmlspecialchars($sheet['title'], ENT_XML1, 'UTF-8');
            $sheetsXml .= "<sheet name=\"{$escapedName}\" sheetId=\"{$sheetNum}\" r:id=\"{$relId}\"/>\n";
        }

        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    {$sheetsXml}
  </sheets>
</workbook>
XML;
    }

    private function getStylesXml(): string
    {
        return <<<XML
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2">
    <numFmt numFmtId="164" formatCode="#,##0.00"/>
    <numFmt numFmtId="165" formatCode="yyyy-mm-dd"/>
  </numFmts>
  <fonts count="6">
    <font><sz val="11"/><name val="Calibri"/><color rgb="FF000000"/></font> <!-- 0: Normal Dark Text -->
    <font><b/><sz val="14"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font> <!-- 1: Big Title Navy -->
    <font><i/><sz val="10"/><color rgb="FF4B5563"/><name val="Calibri"/></font> <!-- 2: Subtitle Gray -->
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font> <!-- 3: Header Text White -->
    <font><b/><sz val="11"/><color rgb="FF1E3A8A"/><name val="Calibri"/></font> <!-- 4: Code Accent Navy Bold -->
    <font><b/><sz val="11"/><color rgb="FF111827"/><name val="Calibri"/></font> <!-- 5: Bold Dark Text -->
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill> <!-- 2: Navy Fill -->
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border><left/><right/><top style="thin"><color rgb="FF000000"/></top><bottom style="double"><color rgb="FF000000"/></bottom></border> <!-- 1: Total Border -->
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <!-- 0: Normal Text -->
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <!-- 1: Big Title -->
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <!-- 2: Subtitle -->
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <!-- 3: Table Header -->
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <!-- 4: Number (#,##0.00) -->
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <!-- 5: Total Row (Navy background, White text, double border) -->
    <xf numFmtId="164" fontId="3" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf>
    <!-- 6: Code Accent (Navy Bold Text, dark blue visible color) -->
    <xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <!-- 7: Date Format -->
    <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>
    <!-- 8: Bold Dark Text -->
    <xf numFmtId="0" fontId="5" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>
XML;
    }
}
