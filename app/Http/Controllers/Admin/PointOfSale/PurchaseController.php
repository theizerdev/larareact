<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\CierreMensual;
use App\Models\Compra;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\Proveedor;
use App\Models\Sucursal;
use App\Services\PurchaseService;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    protected function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (! $user) {
            return '$';
        }

        $empresa = $user->empresa;
        if (! $empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && ! empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function index(Request $request)
    {
        $query = Compra::with(['proveedor', 'user', 'sucursal'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo_compra', 'like', "%{$search}%")
                    ->orWhere('numero_factura', 'like', "%{$search}%")
                    ->orWhereHas('proveedor', fn ($p) => $p->where('razon_social', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('tipo_pago')) {
            $query->where('tipo_pago', $request->tipo_pago);
        }

        $compras = $query->paginate(15)->withQueryString();

        $stats = [
            'total_compras'       => (float) Compra::where('status', 'completada')->sum('total'),
            'compras_mes'         => (float) Compra::where('status', 'completada')
                                        ->whereYear('created_at', now()->year)
                                        ->whereMonth('created_at', now()->month)
                                        ->sum('total'),
            'total_cxp_pendiente' => (float) Compra::where('status', 'completada')->sum('saldo_pendiente'),
            'cantidad_compras'    => Compra::count(),
            'compras_contado'     => (float) Compra::where('status', 'completada')->where('tipo_pago', 'contado')->sum('total'),
            'compras_credito'     => (float) Compra::where('status', 'completada')->where('tipo_pago', 'credito')->sum('total'),
            'deuda_pendiente'     => (float) Compra::where('status', 'completada')->sum('saldo_pendiente'),
        ];

        $proveedores = Proveedor::orderBy('razon_social')->select('id', 'razon_social', 'nombre_comercial')->get();

        return inertia('admin/PointOfSale/Compras/Index', [
            'compras'        => $compras,
            'proveedores'    => $proveedores,
            'stats'          => $stats,
            'filters'        => $request->only(['search', 'status', 'tipo_pago', 'proveedor_id']),
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function create()
    {
        $user = auth()->user();
        $empresa = $user?->empresa;
        $valorDolar = (float) ($empresa?->valor_dolar ?? 20.0);

        $proveedores = Proveedor::where('estado', true)
            ->select('id', 'razon_social', 'nombre_comercial', 'rif_documento', 'telefono')
            ->orderBy('razon_social')
            ->get();

        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo'])
            ->get()
            ->map(function ($p) {
                $marcaNombre = trim((string) $p->marca?->nombre);
                $modeloNombre = trim((string) ($p->modelo?->nombre_comercial ?? $p->modelo?->nombre));
                $variante = trim((string) $p->nombre_variante);
                $codigoBarras = trim((string) $p->codigo_barras);

                $displayName = $variante !== '' ? $variante : implode(' ', array_filter([$marcaNombre, $modeloNombre, $codigoBarras]));

                return [
                    'id' => $p->id,
                    'nombre' => $displayName ?: "Producto #{$p->id}",
                    'codigo' => $p->sku ?? $p->codigo_barras ?? "PRD-{$p->id}",
                    'stock' => (float) ($p->stock ?? 0),
                    'costo_compra' => (float) ($p->costo_compra ?? 0),
                    'precio_venta' => (float) ($p->precio_venta ?? 0),
                ];
            });

        $sucursales = Sucursal::where('status', true)
            ->select('id', 'nombre')
            ->get();

        $activeRegister = CashRegister::getActiveRegister($user);

        // Fondos Mensuales Disponibles
        $fondosMensuales = CierreMensual::orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($c) {
                $monthNames = [
                    1 => 'Enero', 2 => 'Febrero', 3 => 'Marzo', 4 => 'Abril',
                    5 => 'Mayo', 6 => 'Junio', 7 => 'Julio', 8 => 'Agosto',
                    9 => 'Septiembre', 10 => 'Octubre', 11 => 'Noviembre', 12 => 'Diciembre',
                ];
                $name = $monthNames[$c->month] ?? "Mes {$c->month}";

                return [
                    'id' => $c->id,
                    'year' => $c->year,
                    'month' => $c->month,
                    'sucursal_nombre' => $c->sucursal?->nombre ?? 'Todas',
                    'label' => "Fondo de {$name} {$c->year} (Disponible: {$this->getCurrencySymbol()}" . number_format($c->saldo_neto, 2) . ")",
                    'saldo_disponible' => (float) $c->saldo_neto,
                ];
            });

        return inertia('admin/PointOfSale/Compras/Create', [
            'proveedores' => $proveedores,
            'productos' => $productos,
            'sucursales' => $sucursales,
            'activeRegister' => $activeRegister,
            'fondosMensuales' => $fondosMensuales,
            'currencySymbol' => $this->getCurrencySymbol(),
            'valorDolar' => $valorDolar,
        ]);
    }

    public function store(Request $request, PurchaseService $purchaseService)
    {
        $validated = $request->validate([
            'proveedor_id' => 'required|exists:proveedores,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'numero_factura' => 'nullable|string|max:100',
            'numero_control' => 'nullable|string|max:100',
            'tipo_pago' => 'required|in:contado,credito',
            'fecha_emision' => 'required|date',
            'fecha_vencimiento' => 'nullable|date',
            'descuento' => 'nullable|numeric|min:0',
            'monto_inicial_pagado' => 'nullable|numeric|min:0',
            'metodo_pago' => 'nullable|string',
            'referencia_pago' => 'nullable|string',
            'pagar_con_caja' => 'nullable|boolean',
            'usar_fondo_mes' => 'nullable|boolean',
            'cierre_mensual_id' => 'nullable|exists:cierres_mensuales,id',
            'notas' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|exists:productos,id',
            'items.*.cantidad' => 'required|numeric|gt:0',
            'items.*.costo_unitario' => 'required|numeric|min:0',
            'items.*.impuesto_unitario' => 'nullable|numeric|min:0',
            'items.*.update_sale_price' => 'nullable|boolean',
            'items.*.nuevo_precio_venta' => 'nullable|numeric|min:0',
        ]);

        $compra = $purchaseService->createPurchase($validated, auth()->id());

        return redirect()->route('admin.compras.show', $compra->id)
            ->with('success', "Compra #{$compra->codigo_compra} registrada exitosamente.");
    }

    public function show(Compra $compra)
    {
        $compra->load([
            'proveedor',
            'user',
            'sucursal',
            'items.producto.marca',
            'items.producto.modelo',
            'pagos.user',
            'pagos.cashRegister',
        ]);

        // Calcular nombre display de cada producto (igual que en create())
        $compra->items->each(function ($item) {
            if ($item->producto) {
                $p = $item->producto;
                $marcaNombre  = trim((string) $p->marca?->nombre);
                $modeloNombre = trim((string) ($p->modelo?->nombre_comercial ?? $p->modelo?->nombre));
                $variante     = trim((string) $p->nombre_variante);
                $codigo       = trim((string) $p->codigo_barras);

                $displayName = $variante !== ''
                    ? $variante
                    : implode(' ', array_filter([$marcaNombre, $modeloNombre, $codigo]));

                $p->nombre = $displayName ?: "Producto #{$p->id}";
            }
        });

        $user    = auth()->user();
        $empresa = $user?->empresa;

        return inertia('admin/PointOfSale/Compras/Show', [
            'compra'         => $compra,
            'currencySymbol' => $this->getCurrencySymbol(),
            'empresa'        => $empresa ? [
                'razon_social' => $empresa->razon_social,
                'documento'    => $empresa->documento,
                'telefono'     => $empresa->telefono,
                'email'        => $empresa->email,
                'direccion'    => $empresa->direccion,
                'logo'         => $empresa->logo ? "/storage/{$empresa->logo}" : '/image/logo/larareact_logo_transparent.png',
            ] : null,
        ]);
    }

    public function cancel(Compra $compra, PurchaseService $purchaseService)
    {
        $purchaseService->cancelPurchase($compra, auth()->id());

        return back()->with('success', "La compra #{$compra->codigo_compra} ha sido anulada y el stock revertido.");
    }

    public function accountsPayable(Request $request)
    {
        $query = Compra::with(['proveedor', 'user'])
            ->where('status', 'completada')
            ->where('saldo_pendiente', '>', 0)
            ->orderBy('fecha_vencimiento', 'asc');

        if ($request->filled('proveedor_id')) {
            $query->where('proveedor_id', $request->proveedor_id);
        }

        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('codigo_compra', 'like', "%{$search}%")
                    ->orWhere('numero_factura', 'like', "%{$search}%")
                    ->orWhereHas('proveedor', function ($pq) use ($search) {
                        $pq->where('razon_social', 'like', "%{$search}%");
                    });
            });
        }

        $cuentas = $query->paginate(15)->withQueryString();
        $proveedores = Proveedor::where('estado', true)->select('id', 'razon_social')->get();
        $activeRegister = CashRegister::getActiveRegister(auth()->user());

        $totalPendiente = (float) Compra::where('status', 'completada')->where('saldo_pendiente', '>', 0)->sum('saldo_pendiente');

        return inertia('admin/PointOfSale/Compras/CuentasPorPagar', [
            'cuentas' => $cuentas,
            'proveedores' => $proveedores,
            'activeRegister' => $activeRegister,
            'filters' => $request->only(['search', 'proveedor_id']),
            'totalPendiente' => $totalPendiente,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function storePayment(Compra $compra, Request $request, PurchaseService $purchaseService)
    {
        $validated = $request->validate([
            'monto' => 'required|numeric|gt:0',
            'metodo_pago' => 'required|string',
            'referencia' => 'nullable|string|max:100',
            'pagar_con_caja' => 'nullable|boolean',
            'notas' => 'nullable|string',
        ]);

        $purchaseService->addPayment($compra, $validated, auth()->id());

        return back()->with('success', 'Abono a la cuenta por pagar registrado exitosamente.');
    }
}
