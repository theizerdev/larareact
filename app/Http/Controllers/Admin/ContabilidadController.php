<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApunteContable;
use App\Models\AsientoContable;
use App\Models\ConfiguracionContable;
use App\Models\CuentaContable;
use App\Models\Empresa;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContabilidadController extends Controller
{
    protected AccountingService $accountingService;

    public function __construct(AccountingService $accountingService)
    {
        $this->accountingService = $accountingService;
    }

    /**
     * Pantalla de Setup y Configuración por Rubro
     */
    public function setupIndex()
    {
        $user = auth()->user();
        $empresa = $user?->empresa ?? ($user->empresa_id ? Empresa::find($user->empresa_id) : null);
        $config = $empresa ? $this->accountingService->getConfig($empresa->id) : null;

        return Inertia::render('admin/Contabilidad/Setup', [
            'config' => $config,
            'rubros' => [
                ['id' => 'hibrido', 'nombre' => '🛠️🛒 Híbrido: Ventas de Productos + Taller de Reparación', 'desc' => 'Ideal para tiendas de tecnología, celulares o laptops que venden accesorios y reparan equipos.'],
                ['id' => 'retail', 'nombre' => '🛒 Comercio al Detal / Retail / Minimarket', 'desc' => 'Enfocado en ventas masivas de productos y control de stock.'],
                ['id' => 'servicio_tecnico', 'nombre' => '🛠️ Taller de Servicio Técnico Puro', 'desc' => 'Enfocado en mano de obra, diagnósticos y repuestos de taller.'],
                ['id' => 'mayorista', 'nombre' => '📦 Distribuidora / Mayorista', 'desc' => 'Enfocado en facturación a crédito, cuentas por cobrar y por pagar.'],
                ['id' => 'gastronomia', 'nombre' => '🍔 Gastronomía / Alimentos y Bebidas', 'desc' => 'Para restaurantes, cafeterías y negocios de comida.'],
            ],
        ]);
    }

    /**
     * Guardar la selección de rubro y generar el Plan de Cuentas automáticamente
     */
    public function setupStore(Request $request)
    {
        $request->validate([
            'rubro' => 'required|string|in:hibrido,retail,servicio_tecnico,mayorista,gastronomia',
        ]);

        $user = auth()->user();
        $empresa = $user?->empresa ?? ($user->empresa_id ? Empresa::find($user->empresa_id) : null);

        if (!$empresa) {
            return back()->with('notification', ['type' => 'error', 'message' => 'No se encontró la empresa asociada.']);
        }

        $this->accountingService->setupCompanyAccountingByRubro($empresa, $request->rubro);

        return redirect()->route('admin.contabilidad.plan-cuentas')->with('notification', [
            'type' => 'success',
            'message' => 'Plan de Cuentas y Configuración Contable generados exitosamente.',
        ]);
    }

    /**
     * Vista interactiva del Plan de Cuentas
     */
    public function planCuentas()
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;

        if ($empresaId && !ConfiguracionContable::withoutGlobalScopes()->where('empresa_id', $empresaId)->exists()) {
            $empresa = $user?->empresa ?? Empresa::find($empresaId);
            if ($empresa) {
                $this->accountingService->setupCompanyAccountingByRubro($empresa, 'hibrido');
            }
        }

        $cuentas = CuentaContable::whereNull('padre_id')
            ->with(['subcuentas.subcuentas.subcuentas'])
            ->orderBy('codigo')
            ->get();

        return Inertia::render('admin/Contabilidad/PlanCuentas', [
            'cuentas' => $cuentas,
        ]);
    }

    /**
     * Guardar una nueva subcuenta contable manual
     */
    public function storeCuenta(Request $request)
    {
        $validated = $request->validate([
            'codigo' => 'required|string|max:50',
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto,costo',
            'naturaleza' => 'required|in:deudora,acreedora',
            'padre_id' => 'nullable|exists:cuentas_contables,id',
            'nivel' => 'required|integer|min:1|max:4',
        ]);

        $user = auth()->user();
        $validated['empresa_id'] = $user->empresa_id;
        $validated['acepta_movimiento'] = true;
        $validated['activa'] = true;

        CuentaContable::create($validated);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Subcuenta contable creada exitosamente.',
        ]);
    }

    /**
     * Libro Diario (Listado de Asientos Contables)
     */
    public function asientos(Request $request)
    {
        $search = $request->input('search');
        $fromDate = $request->input('from_date');
        $toDate = $request->input('to_date');

        $query = AsientoContable::with(['apuntes.cuenta', 'user']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('numero_asiento', 'like', "%{$search}%")
                  ->orWhere('glosa', 'like', "%{$search}%");
            });
        }

        if ($fromDate) {
            $query->whereDate('fecha', '>=', $fromDate);
        }
        if ($toDate) {
            $query->whereDate('fecha', '<=', $toDate);
        }

        $asientos = $query->orderBy('fecha', 'desc')->paginate(15)->withQueryString();

        $cuentasDisponibles = CuentaContable::where('acepta_movimiento', true)
            ->orderBy('codigo')
            ->get(['id', 'codigo', 'nombre', 'tipo']);

        return Inertia::render('admin/Contabilidad/LibroDiario', [
            'asientos' => $asientos,
            'cuentasDisponibles' => $cuentasDisponibles,
            'filters' => $request->only(['search', 'from_date', 'to_date']),
        ]);
    }

    /**
     * Registrar Asiento Manual
     */
    public function storeAsientoManual(Request $request)
    {
        $validated = $request->validate([
            'glosa' => 'required|string|max:255',
            'fecha' => 'required|date',
            'apuntes' => 'required|array|min:2',
            'apuntes.*.cuenta_id' => 'required|exists:cuentas_contables,id',
            'apuntes.*.debe' => 'nullable|numeric|min:0',
            'apuntes.*.haber' => 'nullable|numeric|min:0',
            'apuntes.*.referencia' => 'nullable|string|max:255',
        ]);

        $user = auth()->user();
        if (!$user->empresa_id) {
            return back()->with('notification', ['type' => 'error', 'message' => 'No se encontró la empresa del usuario.']);
        }

        // Validar Partida Doble
        $totalDebe = collect($validated['apuntes'])->sum(fn($i) => (float)($i['debe'] ?? 0));
        $totalHaber = collect($validated['apuntes'])->sum(fn($i) => (float)($i['haber'] ?? 0));

        if (abs($totalDebe - $totalHaber) >= 0.01) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'El asiento está desbalanceado. El Total Debe ($' . number_format($totalDebe, 2) . ') debe ser igual al Total Haber ($' . number_format($totalHaber, 2) . ').',
            ]);
        }

        $this->accountingService->recordManualEntry($validated, $user->empresa_id, $user->id);

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Asiento contable manual registrado exitosamente.',
        ]);
    }

    /**
     * Cierre de Ejercicio Económico
     */
    public function cierreEjercicio(Request $request)
    {
        $user = auth()->user();
        if (!$user->empresa_id) {
            return back()->with('notification', ['type' => 'error', 'message' => 'No se encontró la empresa del usuario.']);
        }

        $asiento = $this->accountingService->closeFiscalPeriod($user->empresa_id, $user->id);

        if (!$asiento) {
            return back()->with('notification', [
                'type' => 'error',
                'message' => 'No se encontraron saldos de utilidad/pérdida pendientes por cerrar.',
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => 'Cierre de Ejercicio Contable procesado correctamente. Asiento N° ' . $asiento->numero_asiento,
        ]);
    }

    /**
     * Libro Mayor (Movimientos agrupados por cuenta)
     */
    public function mayor(Request $request)
    {
        $cuentaId = $request->input('cuenta_id');
        $user = auth()->user();

        $cuentasDisponibles = CuentaContable::where('acepta_movimiento', true)
            ->orderBy('codigo')
            ->get();

        $movimientos = [];
        $cuentaSeleccionada = null;

        if ($cuentaId) {
            $cuentaSeleccionada = CuentaContable::find($cuentaId);
            $movimientos = ApunteContable::where('cuenta_id', $cuentaId)
                ->with(['asiento'])
                ->orderBy('created_at', 'desc')
                ->paginate(20)
                ->withQueryString();
        }

        return Inertia::render('admin/Contabilidad/LibroMayor', [
            'cuentasDisponibles' => $cuentasDisponibles,
            'cuentaSeleccionada' => $cuentaSeleccionada,
            'movimientos' => $movimientos,
            'filters' => $request->only(['cuenta_id']),
        ]);
    }

    /**
     * Reportes Financieros: Balance de Comprobación & Estado de Resultados (P&L)
     */
    public function reportes()
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;

        // Balance de Comprobación de Sumas y Saldos
        $cuentasReporte = CuentaContable::where('acepta_movimiento', true)
            ->withSum('apuntes as total_debe', 'debe')
            ->withSum('apuntes as total_haber', 'haber')
            ->get()
            ->map(function ($c) {
                $debe = (float) ($c->total_debe ?? 0);
                $haber = (float) ($c->total_haber ?? 0);
                $saldo = $c->naturaleza === 'deudora' ? ($debe - $haber) : ($haber - $debe);

                return [
                    'id' => $c->id,
                    'codigo' => $c->codigo,
                    'nombre' => $c->nombre,
                    'tipo' => $c->tipo,
                    'naturaleza' => $c->naturaleza,
                    'debe' => $debe,
                    'haber' => $haber,
                    'saldo' => $saldo,
                ];
            })
            ->filter(fn($c) => $c['debe'] > 0 || $c['haber'] > 0)
            ->values();

        // Resumen P&L (Estado de Resultados)
        $config = $empresaId ? ConfiguracionContable::where('empresa_id', $empresaId)->first() : null;

        if ($config) {
            $ingresosProductos = (float) ApunteContable::where('cuenta_id', $config->cuenta_ventas_productos_id)->sum('haber');
            $ingresosServicios = (float) ApunteContable::where('cuenta_id', $config->cuenta_ventas_servicios_id)->sum('haber');
            $costoProductos = (float) ApunteContable::where('cuenta_id', $config->cuenta_costo_ventas_productos_id)->sum('debe');
            $costoRepuestos = (float) ApunteContable::where('cuenta_id', $config->cuenta_costo_repuestos_id)->sum('debe');
        } else {
            $ingresosProductos = 0;
            $ingresosServicios = 0;
            $costoProductos = 0;
            $costoRepuestos = 0;
        }

        // Si no se encuentra por ID directo de config, buscar por prefijos de código o tipo
        if ($ingresosProductos == 0) {
            $ingresosProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '4.1.01%'))->sum('haber');
        }
        if ($ingresosServicios == 0) {
            $ingresosServicios = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '4.1.02%'))->sum('haber');
        }

        // Si aún no hay desglose específico pero hay ingresos de tipo 'ingreso', asignarlos a productos
        $totalIngresos = $ingresosProductos + $ingresosServicios;
        if ($totalIngresos == 0) {
            $ingresosProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'ingreso'))->sum('haber');
            $totalIngresos = $ingresosProductos;
        }

        if ($costoProductos == 0) {
            $costoProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '5.1.01%'))->sum('debe');
        }
        if ($costoRepuestos == 0) {
            $costoRepuestos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', 'like', '5.1.02%'))->sum('debe');
        }

        $totalCostos = $costoProductos + $costoRepuestos;
        if ($totalCostos == 0) {
            $costoProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'costo'))->sum('debe');
            $totalCostos = $costoProductos;
        }

        $gastosGenerales = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('tipo', 'gasto'))->sum('debe');

        $utilidadBruta = $totalIngresos - $totalCostos;
        $utilidadNeta = $utilidadBruta - $gastosGenerales;

        return Inertia::render('admin/Contabilidad/ReportesContables', [
            'cuentasReporte' => $cuentasReporte,
            'pnl' => [
                'ingresosProductos' => $ingresosProductos,
                'ingresosServicios' => $ingresosServicios,
                'totalIngresos' => $totalIngresos,
                'costoProductos' => $costoProductos,
                'costoRepuestos' => $costoRepuestos,
                'totalCostos' => $totalCostos,
                'gastosGenerales' => $gastosGenerales,
                'utilidadBruta' => $utilidadBruta,
                'utilidadNeta' => $utilidadNeta,
            ],
        ]);
    }

    /**
     * Módulo de Impuestos, IGTF y Libros Fiscales (Ventas & Compras)
     */
    public function impuestos(Request $request)
    {
        $user = auth()->user();
        $empresa = $user?->empresa ?? ($user->empresa_id ? Empresa::with('pais')->find($user->empresa_id) : null);
        $empresaId = $empresa?->id;

        $fromDate = $request->input('from_date', date('Y-m-01'));
        $toDate = $request->input('to_date', date('Y-m-t'));

        $paisIso = strtoupper($empresa?->pais?->codigo_iso2 ?? 'VE');
        $isVenezuela = in_array($paisIso, ['VE', 'VEN']) || str_contains(strtolower($empresa?->pais?->nombre ?? ''), 'venezuela');

        // Libro de Ventas Fiscales
        $ventasQuery = \App\Models\Sale::with(['cliente', 'user'])
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);

        if ($empresaId) {
            $ventasQuery->where('empresa_id', $empresaId);
        }

        $tasaPais = (float) ($empresa?->pais?->impuesto_predeterminado ?? 16.00);

        $ventasData = $ventasQuery->orderBy('created_at', 'desc')->get()->map(function ($sale) use ($isVenezuela, $tasaPais) {
            $total = (float) $sale->total;
            $subtotal = (float) ($sale->subtotal ?? 0);
            
            if ($sale->impuesto > 0) {
                $taxAmount = (float) $sale->impuesto;
            } elseif ($subtotal > 0 && $subtotal < $total) {
                $taxAmount = $total - $subtotal;
            } else {
                // Generar automáticamente el IVA según la alícuota del país de la empresa
                $taxAmount = round(($total * $tasaPais) / (100 + $tasaPais), 2);
                $subtotal = $total - $taxAmount;
            }

            $igtfAmount = (float) ($sale->igtf_amount ?? 0);

            return [
                'id' => $sale->id,
                'factura_numero' => $sale->codigo_ticket ?? $sale->invoice_number ?? ('FAC-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT)),
                'control_numero' => $sale->control_number ?? ('00-' . str_pad($sale->id, 6, '0', STR_PAD_LEFT)),
                'fecha' => $sale->created_at->format('Y-m-d H:i'),
                'cliente_nombre' => $sale->cliente_nombre ?? $sale->cliente?->razon_social ?? $sale->cliente?->nombre ?? 'Cliente Contado',
                'cliente_rif' => $sale->cliente?->documento ?? 'J-000000000',
                'base_imponible' => $subtotal,
                'monto_iva' => $taxAmount,
                'aliquota_iva' => $subtotal > 0 ? round(($taxAmount / $subtotal) * 100, 1) : $tasaPais,
                'monto_exento' => $taxAmount == 0 ? $total : 0,
                'monto_igtf' => $igtfAmount,
                'total' => $total,
            ];
        });

        // Libro de Compras Fiscales
        $comprasQuery = \App\Models\Compra::with(['proveedor', 'user'])
            ->whereBetween('created_at', [$fromDate . ' 00:00:00', $toDate . ' 23:59:59']);

        if ($empresaId) {
            $comprasQuery->where('empresa_id', $empresaId);
        }

        $comprasData = $comprasQuery->orderBy('created_at', 'desc')->get()->map(function ($compra) use ($tasaPais) {
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
                'id' => $compra->id,
                'factura_numero' => $compra->numero_factura ?? ('COM-' . str_pad($compra->id, 6, '0', STR_PAD_LEFT)),
                'control_numero' => $compra->numero_control ?? ('00-' . str_pad($compra->id, 6, '0', STR_PAD_LEFT)),
                'fecha' => $compra->created_at->format('Y-m-d H:i'),
                'proveedor_nombre' => $compra->proveedor?->razon_social ?? $compra->proveedor?->nombre_comercial ?? 'Proveedor',
                'proveedor_rif' => $compra->proveedor?->rif_documento ?? $compra->proveedor?->documento ?? 'J-000000000',
                'base_imponible' => $subtotal,
                'monto_iva' => $taxAmount,
                'total' => $total,
            ];
        });

        // Totales de resumen tributario
        $totalIvaDebito = $ventasData->sum('monto_iva');
        $totalIvaCredito = $comprasData->sum('monto_iva');
        $totalIgtf = $ventasData->sum('monto_igtf');
        $saldoNetoIva = $totalIvaDebito - $totalIvaCredito;

        return Inertia::render('admin/Contabilidad/Impuestos', [
            'empresaInfo' => [
                'nombre' => $empresa?->razon_social ?? 'Empresa',
                'documento' => $empresa?->documento ?? '',
                'pais' => $empresa?->pais?->nombre ?? 'Venezuela',
                'isVenezuela' => $isVenezuela,
            ],
            'ventasData' => $ventasData,
            'comprasData' => $comprasData,
            'totales' => [
                'totalIvaDebito' => $totalIvaDebito,
                'totalIvaCredito' => $totalIvaCredito,
                'totalIgtf' => $totalIgtf,
                'saldoNetoIva' => $saldoNetoIva,
            ],
            'filters' => [
                'from_date' => $fromDate,
                'to_date' => $toDate,
            ],
        ]);
    }
}
