<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class InventoryAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = InventoryMovement::with([
            'producto.marca',
            'producto.modelo',
            'user',
        ]);

        // Filtro por búsqueda (SKU, nombre variante, motivo, referencia)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('motivo', 'like', "%{$search}%")
                  ->orWhere('referencia', 'like', "%{$search}%")
                  ->orWhereHas('producto', function ($p) use ($search) {
                      $p->where('sku', 'like', "%{$search}%")
                        ->orWhere('nombre_variante', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por Tipo de Movimiento
        if ($tipo = $request->input('tipo')) {
            $query->where('tipo', $tipo);
        }

        // Filtro por Producto
        if ($productoId = $request->input('producto_id')) {
            $query->where('producto_id', $productoId);
        }

        // Ordenación
        $movements = $query->latest()->paginate((int) $request->input('perPage', 15))->withQueryString();

        // Productos activos para el selector modal
        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo', 'categoria'])
            ->get()
            ->map(function ($p) {
                $marcaNombre = trim((string) $p->marca?->nombre);
                $modeloNombre = trim((string) ($p->modelo?->nombre_comercial ?? $p->modelo?->nombre));
                $variante = trim((string) $p->nombre_variante);
                $codigoBarras = trim((string) $p->codigo_barras);

                if ($marcaNombre !== '' && $modeloNombre !== '' && str_starts_with(strtolower($modeloNombre), strtolower($marcaNombre))) {
                    $marcaNombre = '';
                }

                $parts = array_filter([
                    $marcaNombre,
                    $modeloNombre,
                    $variante,
                    $codigoBarras,
                ]);
                $displayName = implode(' ', $parts) ?: "Producto #{$p->id}";

                return [
                    'id' => $p->id,
                    'nombre' => $displayName,
                    'nombre_variante' => $p->nombre_variante,
                    'marca' => $p->marca?->nombre,
                    'modelo' => $p->modelo?->nombre_comercial ?? $p->modelo?->nombre,
                    'categoria' => $p->categoria?->nombre,
                    'sku' => $p->sku,
                    'codigo_barras' => $p->codigo_barras,
                    'stock_actual' => (float) $p->stock,
                    'precio_venta' => (float) $p->precio_venta,
                    'tipo_venta' => $p->tipo_venta,
                ];
            });

        // Estadísticas rápidas del mes
        $currentMonthStart = now()->startOfMonth();
        $totalEntradas = InventoryMovement::where('tipo', 'entrada')->where('created_at', '>=', $currentMonthStart)->sum('cantidad');
        $totalSalidas = InventoryMovement::where('tipo', 'salida')->where('created_at', '>=', $currentMonthStart)->sum('cantidad');
        $totalAjustes = InventoryMovement::where('tipo', 'ajuste')->where('created_at', '>=', $currentMonthStart)->count();

        return Inertia::render('admin/Inventario/Ajustes/Index', [
            'movements' => $movements,
            'productos' => $productos,
            'filters' => $request->only(['search', 'tipo', 'producto_id', 'perPage']),
            'stats' => [
                'totalEntradas' => (float) $totalEntradas,
                'totalSalidas' => (float) $totalSalidas,
                'totalAjustes' => $totalAjustes,
                'totalMovimientos' => InventoryMovement::count(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'tipo' => 'required|string|in:entrada,salida,ajuste',
            'motivo' => 'required|string|max:255',
            'cantidad' => 'required|numeric|min:0.001',
            'costo_unitario' => 'nullable|numeric|min:0',
            'referencia' => 'nullable|string|max:100',
            'notas' => 'nullable|string',
        ], [
            'producto_id.required' => __('Debe seleccionar un producto del catálogo.'),
            'tipo.required' => __('Debe seleccionar el tipo de ajuste (Entrada, Salida o Ajuste).'),
            'motivo.required' => __('Debe ingresar el motivo de la operación.'),
            'cantidad.required' => __('La cantidad es obligatoria.'),
            'cantidad.min' => __('La cantidad debe ser mayor a 0.'),
        ]);

        DB::transaction(function () use ($validated) {
            $producto = Producto::lockForUpdate()->findOrFail($validated['producto_id']);
            $stockAnterior = (float) $producto->stock;
            $cantidadInput = (float) $validated['cantidad'];

            if ($validated['tipo'] === 'entrada') {
                $stockNuevo = $stockAnterior + $cantidadInput;
            } elseif ($validated['tipo'] === 'salida') {
                $stockNuevo = max(0, $stockAnterior - $cantidadInput);
            } else {
                // Ajuste fijo directo
                $stockNuevo = $cantidadInput;
            }

            // Actualizar stock del producto
            $producto->update(['stock' => $stockNuevo]);

            // Registrar movimiento auditado
            InventoryMovement::create([
                'empresa_id' => auth()->user()->empresa_id,
                'sucursal_id' => auth()->user()->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => auth()->id(),
                'tipo' => $validated['tipo'],
                'motivo' => $validated['motivo'],
                'cantidad' => $cantidadInput,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'referencia' => $validated['referencia'] ?? null,
                'costo_unitario' => isset($validated['costo_unitario']) ? (float) $validated['costo_unitario'] : null,
                'notas' => $validated['notas'] ?? null,
            ]);
        });

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Ajuste de inventario registrado correctamente.'),
        ]);
    }
}
