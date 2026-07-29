<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Cliente;
use App\Models\Empresa;
use App\Models\HeldSale;
use App\Models\Pais;
use App\Models\Producto;
use App\Models\Sale;
use App\Models\Servicio;
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
        $activeRegister = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        $registerSummary = null;
        if ($activeRegister) {
            $inflows = (float) $activeRegister->movements()->where('type', 'inflow')->sum('amount');
            $outflows = (float) $activeRegister->movements()->where('type', 'outflow')->sum('amount');
            $openingAmount = (float) $activeRegister->opening_amount;
            $expectedBalance = $openingAmount + $inflows - $outflows;

            $paymentBreakdown = $cashService->getPaymentMethodBreakdown($activeRegister);

            $registerSummary = [
                'id' => $activeRegister->id,
                'opened_at' => $activeRegister->opened_at,
                'opening_amount' => $openingAmount,
                'inflows' => $inflows,
                'outflows' => $outflows,
                'expected_balance' => $expectedBalance,
                'by_payment_method' => $paymentBreakdown,
            ];
        }

        // Get active products
        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo'])
            ->get()
            ->map(function ($p) {
                $parts = array_filter([
                    $p->marca?->nombre,
                    $p->modelo?->nombre,
                    $p->nombre_variante,
                    $p->codigo_barras,
                ]);
                $displayName = implode(' ', $parts) ?: "Producto #{$p->id}";

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

        $catalog = $productos->concat($servicios)->values();

        // Get held sales for this user
        $heldSales = HeldSale::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get();

        // Get clients for autocomplete
        $clientes = Cliente::where('estado', true)
            ->select('id', 'nombre', 'telefono', 'limite_credito', 'saldo_pendiente')
            ->orderBy('nombre')
            ->get();

        return inertia('admin/PointOfSale/Ventas/Terminal', [
            'catalog' => $catalog,
            'activeRegister' => $activeRegister,
            'activeRegisterSummary' => $registerSummary,
            'currencySymbol' => $this->getCurrencySymbol(),
            'heldSales' => $heldSales,
            'clientes' => $clientes,
        ]);
    }

    public function store(Request $request, SaleService $service)
    {
        $validated = $request->validate([
            'cliente_nombre' => 'nullable|string|max:255',
            'cliente_id' => 'nullable|integer|exists:clientes,id',
            'metodo_pago' => 'nullable|string|max:50',
            'impuesto' => 'nullable|numeric|min:0',
            'descuento' => 'nullable|numeric|min:0',
            'monto_recibido' => 'nullable|numeric|min:0',
            'es_credito' => 'nullable|boolean',
            'payments' => 'nullable|array',
            'payments.*.metodo_pago' => 'required_with:payments|string|max:50',
            'payments.*.monto' => 'required_with:payments|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.itemable_id' => 'nullable|integer',
            'items.*.concepto_tipo' => 'required|in:producto,servicio',
            'items.*.nombre' => 'required|string|max:255',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        $sale = $service->processSale($validated, auth()->id());

        return back()->with('notification', [
            'type' => 'success',
            'message' => __("Venta :ticket completada exitosamente.", ['ticket' => $sale->codigo_ticket]),
            'sale' => $sale->load('items', 'payments'),
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

        return inertia('admin/PointOfSale/Ventas/Index', [
            'sales' => $sales,
            'currencySymbol' => $this->getCurrencySymbol(),
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
