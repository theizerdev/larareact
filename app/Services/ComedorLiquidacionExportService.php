<?php

namespace App\Services;

use App\Models\AsistenciaMarcaje;
use App\Models\Empresa;
use App\Models\OpcionComida;
use App\Models\Proveedor;
use App\Models\Sucursal;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ComedorLiquidacionExportService
{
    /**
     * Obtiene la consulta base de marcajes de comida con filtros aplicados.
     */
    public function getConsumosQuery(array $filters, ?int $empresaId = null): Builder
    {
        $fechaInicio = !empty($filters['fecha_inicio'])
            ? Carbon::parse($filters['fecha_inicio'])->startOfDay()
            : Carbon::now()->startOfMonth()->startOfDay();

        $fechaFin = !empty($filters['fecha_fin'])
            ? Carbon::parse($filters['fecha_fin'])->endOfDay()
            : Carbon::now()->endOfDay();

        $query = AsistenciaMarcaje::query()
            ->with([
                'empleado.departamento',
                'empleado.cargo',
                'sucursal',
                'empresa',
                'proveedor',
                'opcionComida.proveedor',
            ])
            ->whereNotNull('comida_tipo')
            ->where('comida_tipo', '!=', '')
            ->where('comida_tipo', '!=', 'No adquirió alimento de las opciones disponibles')
            ->whereBetween('fecha_hora', [$fechaInicio, $fechaFin]);

        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
        }

        if (!empty($filters['sucursal_id'])) {
            $query->where('sucursal_id', (int) $filters['sucursal_id']);
        }

        if (!empty($filters['proveedor_id'])) {
            $proveedorId = (int) $filters['proveedor_id'];
            $nombresOpciones = OpcionComida::where('proveedor_id', $proveedorId)->pluck('nombre')->toArray();

            $query->where(function (Builder $sub) use ($proveedorId, $nombresOpciones) {
                $sub->where('proveedor_id', $proveedorId)
                    ->orWhereHas('opcionComida', fn ($q) => $q->where('proveedor_id', $proveedorId));

                if (!empty($nombresOpciones)) {
                    $sub->orWhereIn('comida_tipo', $nombresOpciones);
                }
            });
        }

        if (!empty($filters['tipo'])) {
            $tipo = $filters['tipo'];
            $query->where(function (Builder $sub) use ($tipo) {
                $sub->whereHas('opcionComida', fn ($q) => $q->where('tipo', $tipo))
                    ->orWhereIn('comida_tipo', OpcionComida::where('tipo', $tipo)->pluck('nombre')->toArray());
            });
        }

        return $query->orderBy('fecha_hora', 'asc');
    }

    /**
     * Construye y retorna la hoja de cálculo completa con carátula y detalle.
     */
    public function generarSpreadsheet(array $filters, ?Empresa $empresa = null, ?Sucursal $sucursal = null): Spreadsheet
    {
        $consumos = $this->getConsumosQuery($filters, $empresa?->id)->get();

        $proveedorSeleccionado = !empty($filters['proveedor_id'])
            ? Proveedor::find($filters['proveedor_id'])
            : null;

        $sucursalSeleccionada = !empty($filters['sucursal_id'])
            ? Sucursal::find($filters['sucursal_id'])
            : $sucursal;

        $fechaInicioStr = !empty($filters['fecha_inicio'])
            ? Carbon::parse($filters['fecha_inicio'])->format('d/m/Y')
            : Carbon::now()->startOfMonth()->format('d/m/Y');

        $fechaFinStr = !empty($filters['fecha_fin'])
            ? Carbon::parse($filters['fecha_fin'])->format('d/m/Y')
            : Carbon::now()->format('d/m/Y');

        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setCreator('Smurfit Westrock - Módulo de Asistencia y Comedor')
            ->setTitle('Liquidación y Conciliación de Comedor')
            ->setSubject('Reporte de Alimentos Consumidos a Proveedor')
            ->setDescription('Reporte financiero para pago y conciliación de servicios de comedor a proveedores.');

        // ─── HOJA 1: RESUMEN Y LIQUIDACIÓN ───────────────────────────────────
        $sheetResumen = $spreadsheet->getActiveSheet();
        $sheetResumen->setTitle('Resumen y Liquidación');
        $this->construirHojaResumen(
            $sheetResumen,
            $consumos,
            $empresa,
            $sucursalSeleccionada,
            $proveedorSeleccionado,
            $fechaInicioStr,
            $fechaFinStr
        );

        // ─── HOJA 2: DETALLE DE CONSUMOS ──────────────────────────────────────
        $sheetDetalle = $spreadsheet->createSheet();
        $sheetDetalle->setTitle('Detalle de Consumos');
        $this->construirHojaDetalle($sheetDetalle, $consumos);

        $spreadsheet->setActiveSheetIndex(0);

        return $spreadsheet;
    }

    /**
     * Construye la carátula ejecutiva con KPIs y tablas resumen.
     */
    protected function construirHojaResumen(
        Worksheet $sheet,
        Collection $consumos,
        ?Empresa $empresa,
        ?Sucursal $sucursal,
        ?Proveedor $proveedor,
        string $fechaInicioStr,
        string $fechaFinStr
    ): void {
        $sheet->setShowGridLines(true);

        // Membrete Superior Smurfit
        $sheet->mergeCells('A1:G1');
        $sheet->setCellValue('A1', 'SMURFIT WESTROCK MÉXICO - CONCILIACIÓN DE COMEDOR');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F172A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        $sheet->mergeCells('A2:G2');
        $sheet->setCellValue('A2', 'ESTADO DE CUENTA Y LIQUIDACIÓN DE ALIMENTOS A PROVEEDORES');
        $sheet->getStyle('A2')->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => '1E293B']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F1F5F9']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(2)->setRowHeight(22);

        // Metadatos
        $sheet->setCellValue('A4', 'Empresa / Razón Social:');
        $sheet->setCellValue('B4', $empresa ? $empresa->razon_social : 'Smurfit Westrock México');
        $sheet->setCellValue('A5', 'Sede / Planta:');
        $sheet->setCellValue('B5', $sucursal ? $sucursal->nombre : 'Todas las Plantas / Global');
        $sheet->setCellValue('A6', 'Proveedor Seleccionado:');
        $sheet->setCellValue('B6', $proveedor ? "{$proveedor->nombre_comercial} ({$proveedor->rfc})" : 'TODOS LOS PROVEEDORES (CONSOLIDADO)');
        $sheet->setCellValue('A7', 'Período del Corte:');
        $sheet->setCellValue('B7', "Del {$fechaInicioStr} al {$fechaFinStr}");
        $sheet->setCellValue('A8', 'Fecha y Hora de Emisión:');
        $sheet->setCellValue('B8', Carbon::now()->format('d/m/Y H:i:s'));

        $sheet->getStyle('A4:A8')->getFont()->setBold(true);

        // Cálculo de KPIs
        $totalRaciones = $consumos->count();
        $totalPagarProveedor = 0.0;
        $totalCobroEmpleado = 0.0;
        $totalSubsidioEmpresa = 0.0;

        foreach ($consumos as $c) {
            $costoProveedor = $this->resolverCostoProveedor($c);
            $costoEmpleado = (float) ($c->comida_costo ?? 0);
            $subsidio = $c->comida_subsidio !== null
                ? (float) $c->comida_subsidio
                : max(0.0, $costoProveedor - $costoEmpleado);

            $totalPagarProveedor += $costoProveedor;
            $totalCobroEmpleado += $costoEmpleado;
            $totalSubsidioEmpresa += $subsidio;
        }

        // Celdas KPI Destacadas
        $kpis = [
            ['col_label' => 'D4', 'col_val' => 'D5', 'label' => 'Total Raciones', 'val' => $totalRaciones, 'format' => '#,##0'],
            ['col_label' => 'E4', 'col_val' => 'E5', 'label' => 'Total Factura Proveedor', 'val' => $totalPagarProveedor, 'format' => '"$"#,##0.00'],
            ['col_label' => 'F4', 'col_val' => 'F5', 'label' => 'Desc. Colaboradores', 'val' => $totalCobroEmpleado, 'format' => '"$"#,##0.00'],
            ['col_label' => 'G4', 'col_val' => 'G5', 'label' => 'Subsidio Empresa', 'val' => $totalSubsidioEmpresa, 'format' => '"$"#,##0.00'],
        ];

        foreach ($kpis as $k) {
            $sheet->setCellValue($k['col_label'], $k['label']);
            $sheet->setCellValue($k['col_val'], $k['val']);
            $sheet->getStyle($k['col_label'])->applyFromArray([
                'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '475569']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getStyle($k['col_val'])->applyFromArray([
                'font' => ['bold' => true, 'size' => 13, 'color' => ['rgb' => '0F172A']],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            ]);
            $sheet->getStyle($k['col_val'])->getNumberFormat()->setFormatCode($k['format']);
        }

        $sheet->getStyle('D4:G5')->applyFromArray([
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CBD5E1']]],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F8FAFC']],
        ]);

        // Tabla Resumen Agrupada por Proveedor
        $row = 10;
        $sheet->mergeCells("A{$row}:G{$row}");
        $sheet->setCellValue("A{$row}", 'RESUMEN POR PROVEEDOR DE ALIMENTOS');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->getRowDimension($row)->setRowHeight(24);

        $row++;
        $headersProv = [
            'A' => 'Proveedor',
            'B' => 'RFC / Identificación',
            'C' => 'Raciones Servidas',
            'D' => 'Costo Prom. Ración',
            'E' => 'Total a Liquidar ($ MXN)',
            'F' => 'Cobrado Empleados ($ MXN)',
            'G' => 'Subsidio Empresa ($ MXN)',
        ];
        foreach ($headersProv as $col => $title) {
            $sheet->setCellValue("{$col}{$row}", $title);
        }
        $sheet->getStyle("A{$row}:G{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '0F172A']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E2E8F0']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension($row)->setRowHeight(22);

        // Agrupar consumos por proveedor
        $agrupadoProveedor = $consumos->groupBy(function ($c) {
            $prov = $c->proveedor ?? $c->opcionComida?->proveedor;
            if ($prov) {
                return $prov->id . '|||' . $prov->nombre_comercial . '|||' . ($prov->rfc ?? 'N/A');
            }
            return '0|||Comedor Interno / Sin Proveedor|||N/A';
        });

        $startDataRow = $row + 1;
        foreach ($agrupadoProveedor as $key => $items) {
            $row++;
            [$pId, $pNombre, $pRFC] = explode('|||', $key);
            $cant = $items->count();
            $subTotalProv = $items->sum(fn ($i) => $this->resolverCostoProveedor($i));
            $subTotalEmp = $items->sum(fn ($i) => (float) ($i->comida_costo ?? 0));
            $subTotalSub = $items->sum(fn ($i) => $i->comida_subsidio !== null ? (float) $i->comida_subsidio : max(0.0, $this->resolverCostoProveedor($i) - (float) ($i->comida_costo ?? 0)));
            $promRacion = $cant > 0 ? $subTotalProv / $cant : 0.0;

            $sheet->setCellValue("A{$row}", $pNombre);
            $sheet->setCellValue("B{$row}", $pRFC);
            $sheet->setCellValue("C{$row}", $cant);
            $sheet->setCellValue("D{$row}", $promRacion);
            $sheet->setCellValue("E{$row}", $subTotalProv);
            $sheet->setCellValue("F{$row}", $subTotalEmp);
            $sheet->setCellValue("G{$row}", $subTotalSub);

            $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("D{$row}:G{$row}")->getNumberFormat()->setFormatCode('"$"#,##0.00');
        }

        // Fila de Totales de Proveedores
        $row++;
        $sheet->setCellValue("A{$row}", 'TOTALES GENERALES:');
        $sheet->mergeCells("A{$row}:B{$row}");
        $sheet->setCellValue("C{$row}", "=SUM(C{$startDataRow}:C" . ($row - 1) . ")");
        $sheet->setCellValue("D{$row}", "=IF(C{$row}>0, E{$row}/C{$row}, 0)");
        $sheet->setCellValue("E{$row}", "=SUM(E{$startDataRow}:E" . ($row - 1) . ")");
        $sheet->setCellValue("F{$row}", "=SUM(F{$startDataRow}:F" . ($row - 1) . ")");
        $sheet->setCellValue("G{$row}", "=SUM(G{$startDataRow}:G" . ($row - 1) . ")");

        $sheet->getStyle("A{$row}:G{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '0F172A']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEF3C7']],
            'borders' => [
                'top' => ['borderStyle' => Border::BORDER_THIN],
                'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
            ],
        ]);
        $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('#,##0');
        $sheet->getStyle("D{$row}:G{$row}")->getNumberFormat()->setFormatCode('"$"#,##0.00');

        // Tabla Resumen por Clasificación (Desayuno, Almuerzo, Cena, Refrigerio)
        $row += 3;
        $sheet->mergeCells("A{$row}:E{$row}");
        $sheet->setCellValue("A{$row}", 'DISTRIBUCIÓN POR TIPO DE ALIMENTO (TIEMPOS DE COMIDA)');
        $sheet->getStyle("A{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 11, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '0F766E']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT],
        ]);
        $sheet->getRowDimension($row)->setRowHeight(24);

        $row++;
        $headersTipo = [
            'A' => 'Tipo de Alimento',
            'B' => 'Raciones Servidas',
            'C' => '% del Total',
            'D' => 'Total Proveedor ($ MXN)',
            'E' => 'Subsidio Empresa ($ MXN)',
        ];
        foreach ($headersTipo as $col => $title) {
            $sheet->setCellValue("{$col}{$row}", $title);
        }
        $sheet->getStyle("A{$row}:E{$row}")->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['rgb' => '0F172A']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'CCFBF1']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        $tiposEtiquetas = [
            'desayuno' => '☕ Desayuno',
            'almuerzo' => '🍽️ Almuerzo / Comida',
            'cena' => '🌙 Cena',
            'refrigerio' => '🍎 Refrigerio / Snack',
            'otro' => '🍴 Otros Alimentos',
        ];

        $agrupadoTipo = $consumos->groupBy(function ($c) {
            return $c->opcionComida?->tipo ?? 'otro';
        });

        $startTipoRow = $row + 1;
        foreach ($tiposEtiquetas as $key => $lbl) {
            $items = $agrupadoTipo->get($key, collect());
            if ($items->isEmpty() && $key === 'otro') {
                continue;
            }
            $row++;
            $cant = $items->count();
            $pct = $totalRaciones > 0 ? ($cant / $totalRaciones) : 0.0;
            $montoProv = $items->sum(fn ($i) => $this->resolverCostoProveedor($i));
            $montoSub = $items->sum(fn ($i) => $i->comida_subsidio !== null ? (float) $i->comida_subsidio : max(0.0, $this->resolverCostoProveedor($i) - (float) ($i->comida_costo ?? 0)));

            $sheet->setCellValue("A{$row}", $lbl);
            $sheet->setCellValue("B{$row}", $cant);
            $sheet->setCellValue("C{$row}", $pct);
            $sheet->setCellValue("D{$row}", $montoProv);
            $sheet->setCellValue("E{$row}", $montoSub);

            $sheet->getStyle("B{$row}")->getNumberFormat()->setFormatCode('#,##0');
            $sheet->getStyle("C{$row}")->getNumberFormat()->setFormatCode('0.0%');
            $sheet->getStyle("D{$row}:E{$row}")->getNumberFormat()->setFormatCode('"$"#,##0.00');
        }

        // Auto-fit columnas de resumen
        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
    }

    /**
     * Construye la hoja de detalle individual con cada ración consumida.
     */
    protected function construirHojaDetalle(Worksheet $sheet, Collection $consumos): void
    {
        $sheet->setShowGridLines(true);

        $headers = [
            'A1' => 'No.',
            'B1' => 'Fecha',
            'C1' => 'Hora',
            'D1' => 'No. Nómina',
            'E1' => 'Colaborador',
            'F1' => 'Departamento',
            'G1' => 'Puesto / Cargo',
            'H1' => 'Sede / Planta',
            'I1' => 'Proveedor de Alimentos',
            'J1' => 'Alimento / Platillo',
            'K1' => 'Clasificación',
            'L1' => 'Factura Proveedor ($)',
            'M1' => 'Desc. Empleado ($)',
            'N1' => 'Subsidio Empresa ($)',
            'O1' => 'Kiosko / Origen',
        ];

        foreach ($headers as $cell => $val) {
            $sheet->setCellValue($cell, $val);
        }

        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 10],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ];
        $sheet->getStyle('A1:O1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(28);

        $row = 2;
        foreach ($consumos as $index => $c) {
            $empleado = $c->empleado;
            $proveedor = $c->proveedor ?? $c->opcionComida?->proveedor;
            $fechaHora = Carbon::parse($c->fecha_hora);

            $costoProveedor = $this->resolverCostoProveedor($c);
            $costoEmpleado = (float) ($c->comida_costo ?? 0);
            $subsidio = $c->comida_subsidio !== null
                ? (float) $c->comida_subsidio
                : max(0.0, $costoProveedor - $costoEmpleado);

            $tipoStr = match ($c->opcionComida?->tipo) {
                'desayuno' => 'Desayuno',
                'almuerzo' => 'Almuerzo / Comida',
                'cena' => 'Cena',
                'refrigerio' => 'Refrigerio',
                default => 'Comida',
            };

            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $fechaHora->format('Y-m-d'));
            $sheet->setCellValue("C{$row}", $fechaHora->format('H:i:s'));
            $sheet->setCellValue("D{$row}", $empleado?->numero_empleado ?? $empleado?->documento_identidad ?? 'S/N');
            $sheet->setCellValue("E{$row}", $empleado?->nombre_completo ?? 'Colaborador no identificado');
            $sheet->setCellValue("F{$row}", $empleado?->departamento?->nombre ?? 'General');
            $sheet->setCellValue("G{$row}", $empleado?->cargo?->nombre ?? 'Operativo');
            $sheet->setCellValue("H{$row}", $c->sucursal?->nombre ?? 'Planta Principal');
            $sheet->setCellValue("I{$row}", $proveedor?->nombre_comercial ?? 'Comedor Interno');
            $sheet->setCellValue("J{$row}", $c->comida_tipo);
            $sheet->setCellValue("K{$row}", $tipoStr);
            $sheet->setCellValue("L{$row}", $costoProveedor);
            $sheet->setCellValue("M{$row}", $costoEmpleado);
            $sheet->setCellValue("N{$row}", $subsidio);
            $sheet->setCellValue("O{$row}", AsistenciaMarcaje::labelOrigen($c->origen));

            $sheet->getStyle("A{$row}:C{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("D{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("K{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("O{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            $sheet->getStyle("L{$row}:N{$row}")->getNumberFormat()->setFormatCode('"$"#,##0.00');

            $row++;
        }

        // Fila final de Totales
        $lastDataRow = $row - 1;
        if ($lastDataRow >= 2) {
            $sheet->setCellValue("A{$row}", 'TOTALES GENERALES:');
            $sheet->mergeCells("A{$row}:K{$row}");
            $sheet->setCellValue("L{$row}", "=SUM(L2:L{$lastDataRow})");
            $sheet->setCellValue("M{$row}", "=SUM(M2:M{$lastDataRow})");
            $sheet->setCellValue("N{$row}", "=SUM(N2:N{$lastDataRow})");

            $sheet->getStyle("A{$row}:O{$row}")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '0F172A']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'FEF3C7']],
                'borders' => [
                    'top' => ['borderStyle' => Border::BORDER_THIN],
                    'bottom' => ['borderStyle' => Border::BORDER_DOUBLE],
                ],
            ]);
            $sheet->getStyle("L{$row}:N{$row}")->getNumberFormat()->setFormatCode('"$"#,##0.00');
            $sheet->getRowDimension($row)->setRowHeight(24);
        }

        // Auto-fit columnas de detalle
        foreach (range('A', 'O') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Congelar encabezado de la tabla de detalle
        $sheet->freezePane('A2');
    }

    /**
     * Resuelve el costo proveedor de una ración considerando fallback.
     */
    protected function resolverCostoProveedor(AsistenciaMarcaje $marcaje): float
    {
        if ($marcaje->comida_costo_empresa !== null) {
            return (float) $marcaje->comida_costo_empresa;
        }

        if ($marcaje->opcionComida && $marcaje->opcionComida->costo_empresa !== null) {
            return (float) $marcaje->opcionComida->costo_empresa;
        }

        // Fallback por coincidencia de nombre en opciones de comida
        $opcionFallback = OpcionComida::where('nombre', $marcaje->comida_tipo)->first();
        if ($opcionFallback && $opcionFallback->costo_empresa !== null) {
            return (float) $opcionFallback->costo_empresa;
        }

        // Si no hay costo de proveedor registrado, se asume el costo del empleado
        return (float) ($marcaje->comida_costo ?? 0.0);
    }

    /**
     * Descarga como StreamedResponse el archivo Excel generado.
     */
    public function exportarExcel(array $filters, ?Empresa $empresa = null, ?Sucursal $sucursal = null): StreamedResponse
    {
        $spreadsheet = $this->generarSpreadsheet($filters, $empresa, $sucursal);
        $writer = new Xlsx($spreadsheet);

        $provPart = !empty($filters['proveedor_id']) ? "prov_{$filters['proveedor_id']}_" : 'consolidado_';
        $filename = "liquidacion_comedor_{$provPart}" . date('Ymd_His') . '.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'max-age=0',
        ]);
    }
}
