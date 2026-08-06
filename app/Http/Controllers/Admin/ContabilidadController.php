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

        return Inertia::render('admin/Contabilidad/LibroDiario', [
            'asientos' => $asientos,
            'filters' => $request->only(['search', 'from_date', 'to_date']),
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
        $ingresosProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', '4.1.01.01'))->sum('haber');
        $ingresosServicios = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', '4.1.02.01'))->sum('haber');
        $totalIngresos = $ingresosProductos + $ingresosServicios;

        $costoProductos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', '5.1.01.01'))->sum('debe');
        $costoRepuestos = (float) ApunteContable::whereHas('cuenta', fn($q) => $q->where('codigo', '5.1.02.01'))->sum('debe');
        $totalCostos = $costoProductos + $costoRepuestos;

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
}
