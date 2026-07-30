<?php

namespace App\Http\Controllers\Admin\Inventario;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Producto;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class KardexController extends Controller
{
    public function index(Request $request): Response
    {
        $query = InventoryMovement::with([
            'producto.marca',
            'producto.modelo',
            'user',
        ]);

        // Filtro por Producto
        if ($productoId = $request->input('producto_id')) {
            $query->where('producto_id', $productoId);
        }

        // Filtro por Búsqueda (SKU, nombre, referencia, motivo)
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

        // Filtro por Tipo (entrada, salida, ajuste, venta)
        if ($tipo = $request->input('tipo')) {
            $query->where('tipo', $tipo);
        }

        // Filtro por Fechas
        if ($startDate = $request->input('start_date')) {
            $query->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
        }
        if ($endDate = $request->input('end_date')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        $movements = $query->latest()->paginate((int) $request->input('perPage', 15))->withQueryString();

        // Productos activos para el selector de Kardex
        $productos = Producto::where('estado', true)
            ->with(['marca', 'modelo', 'categoria'])
            ->get()
            ->map(function ($p) {
                $parts = array_filter([
                    $p->marca?->nombre,
                    $p->modelo?->nombre_comercial ?? $p->modelo?->nombre,
                    $p->nombre_variante,
                ]);
                $displayName = implode(' ', $parts) ?: "Producto #{$p->id}";

                return [
                    'id' => $p->id,
                    'nombre' => $displayName,
                    'marca' => $p->marca?->nombre,
                    'modelo' => $p->modelo?->nombre_comercial ?? $p->modelo?->nombre,
                    'categoria' => $p->categoria?->nombre,
                    'sku' => $p->sku,
                    'codigo_barras' => $p->codigo_barras,
                    'stock_actual' => (float) $p->stock,
                ];
            });

        // Información del producto seleccionado (si aplica)
        $selectedProducto = null;
        if ($productoId) {
            $p = Producto::with(['marca', 'modelo', 'categoria'])->find($productoId);
            if ($p) {
                $selectedProducto = [
                    'id' => $p->id,
                    'nombre' => $p->nombre_variante,
                    'sku' => $p->sku,
                    'stock' => (float) $p->stock,
                    'stock_minimo' => (float) $p->stock_minimo,
                    'precio_venta' => (float) $p->precio_venta,
                    'precio_compra' => (float) $p->precio_compra,
                    'categoria' => $p->categoria?->nombre,
                    'marca' => $p->marca?->nombre,
                    'modelo' => $p->modelo?->nombre,
                ];
            }
        }

        return Inertia::render('admin/Inventario/Kardex/Index', [
            'movements' => $movements,
            'productos' => $productos,
            'selectedProducto' => $selectedProducto,
            'filters' => $request->only(['search', 'tipo', 'producto_id', 'start_date', 'end_date', 'perPage']),
        ]);
    }
}
