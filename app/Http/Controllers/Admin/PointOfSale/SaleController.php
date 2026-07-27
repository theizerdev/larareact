<?php

namespace App\Http\Controllers\Admin\PointOfSale;

use App\Http\Controllers\Controller;
use App\Models\CashRegister;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Producto;

use App\Models\Sale;
use App\Models\Servicio;
use App\Services\SaleService;
use Illuminate\Http\Request;

class SaleController extends Controller
{
    private function getCurrencySymbol(): string
    {
        $user = auth()->user();
        if (!$user) {
            return '$';
        }

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

    public function terminal()
    {
        // Get active open cash register for user
        $activeRegister = CashRegister::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        // Get active products
        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo'])
            ->get()
            ->map(function ($p) {
                // Build display name: Marca + Modelo + Variante
                $parts = array_filter([
                    $p->marca?->nombre,
                    $p->modelo?->nombre,
                    $p->nombre_variante,
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
                    'nombre' => $s->nombre,
                    'codigo' => $s->codigo ?? "SRV-{$s->id}",
                    'precio' => (float) ($s->precio ?? 0),
                    'stock' => null, // unlimited for services
                ];
            });

        $catalog = $productos->concat($servicios)->values();

        return inertia('admin/PointOfSale/Ventas/Terminal', [
            'catalog' => $catalog,
            'activeRegister' => $activeRegister,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }

    public function store(Request $request, SaleService $service)
    {
        $validated = $request->validate([
            'cliente_nombre' => 'nullable|string|max:255',
            'metodo_pago' => 'required|string|max:50',
            'impuesto' => 'nullable|numeric|min:0',
            'descuento' => 'nullable|numeric|min:0',
            'monto_recibido' => 'required|numeric|min:0',
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
            'message' => __("Venta {$sale->codigo_ticket} completada exitosamente."),
            'sale' => $sale->load('items'),
        ]);
    }

    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $perPage = $request->input('perPage', 10);

        $query = Sale::with(['user', 'items']);

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

    public function show(Sale $sale)
    {
        $sale->load(['user', 'items', 'cashRegister']);

        return inertia('admin/PointOfSale/Ventas/Show', [
            'sale' => $sale,
            'currencySymbol' => $this->getCurrencySymbol(),
        ]);
    }
}
