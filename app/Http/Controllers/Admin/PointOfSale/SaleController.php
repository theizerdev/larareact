<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\HeldSale;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\Servicio;
use App\Models\OrdenReparacion;
use App\Services\CashRegisterService;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) return '$';

        $empresa = $user->empresa;
        if (!$empresa && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
        }

        if ($empresa && $empresa->pais_id) {
            $pais = Pais::find($empresa->pais_id);
            if ($pais && !empty($pais->simbolo_moneda)) {
                return $pais->simbolo_moneda;
            }
        }

        return '$';
    }

    public function terminal(CashRegisterService $cashService)
    {
        $activeRegister = CashRegister::getActiveRegister();

        $registerSummary = null;
        if ($activeRegister) {
            $inflows = (float) $activeRegister->movements()->where('type', 'inflow')->sum('amount');
            $outflows = (float) $activeRegister->movements()->where('type', 'outflow')->sum('amount');
            $openingAmount = (float) $activeRegister->opening_amount;
            $totalShiftBalance = $openingAmount + $inflows - $outflows;

            // Cash movements that physically enter/leave the drawer
            $cashInflows = (float) $activeRegister->movements()
                ->where('type', 'inflow')
                ->whereIn('metodo_pago', ['efectivo', 'dolar'])
                ->sum('amount');

            $cashOutflows = (float) $activeRegister->movements()
                ->where('type', 'outflow')
                ->whereIn('metodo_pago', ['efectivo', 'dolar'])
                ->sum('amount');

            // Non-cash movements (tarjeta, transferencia, etc.)
            $electronicInflows = (float) $activeRegister->movements()
                ->where('type', 'inflow')
                ->whereNotIn('metodo_pago', ['efectivo', 'dolar'])
                ->sum('amount');

            $expectedCashBalance = $openingAmount + $cashInflows - $cashOutflows;

            $paymentBreakdown = $cashService->getPaymentMethodBreakdown($activeRegister);

            $registerSummary = [
                'id' => $activeRegister->id,
                'opened_at' => $activeRegister->opened_at,
                'opening_amount' => $openingAmount,
                'inflows' => $inflows,
                'outflows' => $outflows,
                'cash_inflows' => $cashInflows,
                'cash_outflows' => $cashOutflows,
                'electronic_inflows' => $electronicInflows,
                'expected_cash_balance' => $expectedCashBalance,
                'expected_balance' => $expectedCashBalance,
                'total_turn_sales' => $inflows,
                'total_turn_balance' => $totalShiftBalance,
                'by_payment_method' => $paymentBreakdown,
            ];
        }

        // Get active products
        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo'])
            ->get()
            ->map(function ($p) {
                $marcaNombre = trim((string) $p->marca?->nombre);
                $modeloNombre = trim((string) ($p->modelo?->nombre_comercial ?? $p->modelo?->nombre));
                $variante = trim((string) $p->nombre_variante);
                $codigoBarras = trim((string) $p->codigo_barras);

                // Si nombre_variante ya está definido de forma descriptiva
                if ($variante !== '') {
                    $displayName = $variante;
                    // Si variante ya incluye el código de barras al final o no lo tiene, agregarlo opcionalmente si no existe
                    if ($codigoBarras !== '' && !str_contains($displayName, $codigoBarras)) {
                        $displayName .= " {$codigoBarras}";
                    }
                } else {
                    if ($marcaNombre !== '' && $modeloNombre !== '' && str_starts_with(strtolower($modeloNombre), strtolower($marcaNombre))) {
                        $marcaNombre = '';
                    }

                    $parts = array_filter([
                        $marcaNombre,
                        $modeloNombre,
                        $codigoBarras,
                    ]);
                    $displayName = implode(' ', $parts) ?: "Producto #{$p->id}";
                }

                // Limpiar duplicaciones dobles del tipo 'Apple Apple'
                if ($marcaNombre !== '') {
                    $doubleBrand = "{$marcaNombre} {$marcaNombre}";
                    if (str_starts_with(strtolower($displayName), strtolower($doubleBrand))) {
                        $displayName = substr($displayName, strlen($marcaNombre) + 1);
                    }
                }

                return [
                    'id' => $p->id,
                    'tipo' => 'producto',
                    'nombre' => $displayName,
                    'codigo' => $p->sku ?? $p->codigo_barras ?? "PRD-{$p->id}",
                    'precio' => (float) ($p->precio_venta ?? 0),
                    'stock' => $p->usa_inventario ? ($p->stock ?? 0) : null,
                ];
            });

        // Get active services
        $servicios = Servicio::where('estado', true)
            ->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'tipo' => 'servicio',
                    'nombre' => $s->nombre ?? "Servicio #{$s->id}",
                    'codigo' => $s->codigo ?? "SRV-{$s->id}",
                    'precio' => (float) ($s->precio ?? 0),
                    'stock' => null,
                ];
            });

        $reparaciones = OrdenReparacion::where('empresa_id', auth()->user()?->empresa_id)
            ->where('estado_orden', '!=', 'cancelado')
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($reparacion) {
                $displayName = trim((string) ($reparacion->cliente_nombre ?: 'Reparación'));
                $numeroOrden = trim((string) ($reparacion->numero_orden ?: ''));
                if ($numeroOrden !== '') {
                    $displayName = "{$displayName} - {$numeroOrden}";
                }

                $costoEstimado = (float) max(
                    $reparacion->costo_estimado ?? 0,
                    ($reparacion->costo_mano_obra ?? 0) + ($reparacion->costo_repuestos ?? 0)
                );
                $anticipo = (float) ($reparacion->anticipo ?? 0);
                $saldoRestante = (float) ($reparacion->saldo_restante ?? max(0, $costoEstimado - $anticipo));

                return [
                    'id' => $reparacion->id,
                    'tipo' => 'reparacion',
                    'nombre' => $displayName,
                    'codigo' => $numeroOrden !== '' ? $numeroOrden : "REP-{$reparacion->id}",
                    'precio' => $saldoRestante,
                    'costo_estimado' => $costoEstimado,
                    'anticipo' => $anticipo,
                    'saldo_restante' => $saldoRestante,
                    'stock' => null,
                    'cliente_id' => $reparacion->cliente_id,
                    'cliente_nombre' => $reparacion->cliente_nombre,
                    'estado_orden' => $reparacion->estado_orden,
                    'dispositivo' => trim("{$reparacion->tipo_dispositivo} {$reparacion->marca_nombre} {$reparacion->modelo_nombre}"),
                ];
            });

        $catalog = $productos->concat($servicios)->concat($reparaciones)->values();

        // Get held sales for this user
        $heldSales = HeldSale::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        // Get clients for autocomplete
        $clientes = Cliente::where('estado', true)
            ->select('id', 'nombre', 'telefono', 'limite_credito', 'saldo_pendiente')
            ->orderBy('nombre')
            ->get();

        $empresa = auth()->user()?->empresa;
        $valorDolar = (float) ($empresa?->valor_dolar ?? 20.0);

        return inertia('admin/PointOfSale/Ventas/Terminal', [
            'catalog' => $catalog,
            'activeRegister' => $activeRegister,
            'activeRegisterSummary' => $registerSummary,
            'currencySymbol' => $this->getCurrencySymbol(),
            'valorDolar' => $valorDolar,
            'heldSales' => $heldSales,
            'clientes' => $clientes,
            'empresa' => $empresa ? [
                'razon_social' => $empresa->razon_social ?? $empresa->nombre ?? $empresa->nombre_comercial,
                'documento' => $empresa->documento,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'direccion' => $empresa->direccion,
                'logo' => $empresa->logo ? (str_starts_with($empresa->logo, '/') || str_starts_with($empresa->logo, 'http') ? $empresa->logo : "/storage/{$empresa->logo}") : ($empresa->logo_mini ? (str_starts_with($empresa->logo_mini, '/') || str_starts_with($empresa->logo_mini, 'http') ? $empresa->logo_mini : "/storage/{$empresa->logo_mini}") : '/image/logo/5.png'),
            ] : null,
        ]);
    }

    public function updateValorDolar(Request $request)
    {
        $validated = $request->validate([
            'valor_dolar' => 'required|numeric|gt:0',
        ]);

        $user = auth()->user();
        if ($user && $user->empresa_id) {
            $empresa = Empresa::find($user->empresa_id);
            if ($empresa) {
                $empresa->update(['valor_dolar' => (float) $validated['valor_dolar']]);
            }
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Valor del dólar actualizado exitosamente.'),
        ]);
    }

    public function store(SaleRequest $request, SaleService $service)
    {
        $validated = $request->validated();

        $sale = $service->processSale($validated, auth()->id());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Venta :ticket completada exitosamente.", ['ticket' => $sale->codigo_ticket]),
            'sale' => new SaleResource($sale->load('items', 'payments')),
        ]);
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Sale::with(['user', 'items', 'payments']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('codigo_ticket', 'like', "%{$search}%")
                  ->orWhere('cliente_nombre', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '') {
            $query->where('estado', $status);
        }

        $sales = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        if ($request->wantsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'sales' => SaleResource::collection($sales),
            ]);
        }

        $user = auth()->user();
        $empresa = $user?->empresa;

        return inertia('admin/PointOfSale/Ventas/Index', [
            'sales' => SaleResource::collection($sales),
            'currencySymbol' => $this->getCurrencySymbol(),
            'empresa' => $empresa ? [
                'razon_social' => $empresa->razon_social ?? $empresa->nombre ?? $empresa->nombre_comercial,
                'documento' => $empresa->documento,
                'telefono' => $empresa->telefono,
                'email' => $empresa->email,
                'direccion' => $empresa->direccion,
                'logo' => $empresa->logo ? (str_starts_with($empresa->logo, '/') || str_starts_with($empresa->logo, 'http') ? $empresa->logo : "/storage/{$empresa->logo}") : ($empresa->logo_mini ? (str_starts_with($empresa->logo_mini, '/') || str_starts_with($empresa->logo_mini, 'http') ? $empresa->logo_mini : "/storage/{$empresa->logo_mini}") : '/image/logo/5.png'),
            ] : null,
            'filters' => $request->only(['search', 'status', 'perPage']),
        ]);
    }

    public function show(Sale $venta)
    {
        $venta->load(['user', 'items', 'payments', 'cashRegister']);

        return inertia('admin/PointOfSale/Ventas/Show', [
            'sale' => $venta,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    // ---- Held Sales (Ventas en Espera) ----

    public function holdSale(Request $request)
    {
        $validated = $request->validate([
            'label' => 'nullable|string|max:255',
            'cliente_nombre' => 'nullable|string|max:255',
            'cart_data' => 'required|array|min:1',
        ]);

        $user = auth()->user();

        HeldSale::create([
            'empresa_id' => $user->empresa_id,
            'sucursal_id' => $user->sucursal_id,
            'user_id' => $user->id,
            'label' => $validated['label'] ?? null,
            'cliente_nombre' => $validated['cliente_nombre'] ?? 'Cliente General',
            'cart_data' => $validated['cart_data'],
        ]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Venta puesta en espera exitosamente.'),
        ]);
    }

    public function resumeSale(HeldSale $heldSale)
    {
        $cartData = $heldSale->cart_data;
        $clienteNombre = $heldSale->cliente_nombre;

        $heldSale->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Venta retomada.'),
        ])->with('resumedCart', [
            'cart_data' => $cartData,
            'cliente_nombre' => $clienteNombre,
        ]);
    }

    public function deleteHeldSale(HeldSale $heldSale)
    {
        $heldSale->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Venta en espera descartada.'),
        ]);
    }
}
