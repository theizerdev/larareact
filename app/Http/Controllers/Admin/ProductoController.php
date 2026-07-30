<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use App\Models\Familia;
use App\Models\InventoryMovement;
use App\Models\Marca;
use App\Models\Modelo;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductoController extends Controller
{
    /**
     * Display a listing of the products/variants with filters and inventory stats.
     */
    public function index(Request $request): Response
    {
        $query = Producto::with([
            'categoria',
            'marca',
            'familia',
            'modelo',
        ]);

        // Filtro de Búsqueda (SKU, Código de barras, Nombre de Variante)
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhere('codigo_barras', 'like', "%{$search}%")
                  ->orWhere('nombre_variante', 'like', "%{$search}%")
                  ->orWhereHas('modelo', function ($m) use ($search) {
                      $m->where('nombre_comercial', 'like', "%{$search}%")
                        ->orWhere('codigo_modelo', 'like', "%{$search}%");
                  });
            });
        }

        // Filtro por Modelo
        if ($modeloId = $request->input('modelo_id')) {
            $query->where('modelo_id', $modeloId);
        }

        // Filtro por Condición
        if ($condicion = $request->input('condicion')) {
            $query->where('condicion', $condicion);
        }

        // Ordenación
        $sortBy = $request->input('sortBy', 'created_at');
        $sortDir = $request->input('sortDir', 'desc');
        $allowedSorts = ['id', 'sku', 'nombre_variante', 'precio_venta', 'precio_mayoreo', 'stock', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        $perPage = (int) $request->input('perPage', 10);
        $productos = $query->paginate($perPage)->withQueryString();

        // Opciones de Categorías, Marcas, Familias y Modelos para selectores en cascada y creaciones en caliente
        $categorias = Categoria::where('estado', true)
            ->select(['id', 'nombre'])
            ->orderBy('nombre')
            ->get();

        $marcas = Marca::where('estado', true)
            ->select(['id', 'nombre'])
            ->orderBy('nombre')
            ->get();

        $familias = Familia::where('estado', true)
            ->select(['id', 'nombre', 'marca_id', 'categoria_id', 'specs_json'])
            ->orderBy('nombre')
            ->get();

        $modelos = Modelo::with(['marca', 'familia', 'categoria'])
            ->where('estado', true)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'nombre' => "{$m->marca->nombre} {$m->nombre_comercial}" . ($m->codigo_modelo ? " ({$m->codigo_modelo})" : ''),
                'nombre_comercial' => $m->nombre_comercial,
                'codigo_modelo' => $m->codigo_modelo,
                'marca_id' => $m->marca_id,
                'familia_id' => $m->familia_id,
                'categoria_id' => $m->categoria_id,
                'marca' => $m->marca->nombre,
                'familia' => $m->familia->nombre,
                'categoria' => $m->categoria?->nombre ?? 'General',
                'specs_json' => $m->specs_overrides ?? [],
            ]);

        // Estadísticas rápidas de Inventario
        $totalProductos = Producto::count();
        $stockTotal = Producto::sum('stock');
        $stockBajoCount = Producto::whereColumn('stock', '<=', 'stock_minimo')->where('usa_inventario', true)->count();
        $valorInventario = Producto::selectRaw('SUM(stock * precio_venta) as total')->value('total') ?? 0;

        return Inertia::render('admin/Productos/Index', [
            'productos' => $productos,
            'categorias' => $categorias,
            'marcas' => $marcas,
            'familias' => $familias,
            'modelos' => $modelos,
            'filters' => $request->only(['search', 'modelo_id', 'condicion', 'sortBy', 'sortDir', 'perPage']),
            'stats' => [
                'totalProductos' => $totalProductos,
                'stockTotal' => (float) $stockTotal,
                'stockBajoCount' => $stockBajoCount,
                'valorInventario' => (float) $valorInventario,
            ],
        ]);
    }

    /**
     * Store a newly created product/variant in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'modelo_id' => 'required|exists:modelos,id',
            'sku' => 'required|string|max:100|unique:productos,sku',
            'codigo_barras' => 'nullable|string|max:100|unique:productos,codigo_barras',
            'nombre_variante' => 'required|string|max:255',
            'condicion' => 'required|string|in:nuevo,usado,reacondicionado,repuesto',
            'tipo_venta' => 'required|string|in:unidad,granel,paquete',
            'usa_inventario' => 'boolean',
            'variant_specs' => 'nullable|array',
            'precio_compra' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'precio_mayoreo' => 'nullable|numeric|min:0',
            'stock' => 'required_if:usa_inventario,true|nullable|numeric|min:0',
            'stock_minimo' => 'required_if:usa_inventario,true|nullable|numeric|min:0',
            'tipo_impuesto' => 'required|string|in:gravado,exento,tasa_cero',
            'tasa_iva' => 'nullable|numeric|min:0',
            'aplica_impuesto_adicional' => 'boolean',
            'tasa_impuesto_adicional' => 'nullable|numeric|min:0',
            'aplica_retencion' => 'boolean',
            'tasa_retencion' => 'nullable|numeric|min:0',
            'precio_incluye_impuestos' => 'boolean',
            'clave_sat_producto' => 'nullable|string|max:20',
            'clave_sat_unidad' => 'nullable|string|max:20',
            'objeto_impuesto_sat' => 'nullable|string|max:5',
            'estado' => 'boolean',
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
        ], [
            'stock.required' => __('La cantidad actual (stock) es obligatoria.'),
            'stock.required_if' => __('Debe ingresar la cantidad actual de stock.'),
            'stock.numeric' => __('La cantidad de stock debe ser un número válido.'),
            'stock.min' => __('El stock no puede ser negativo.'),
        ]);

        $modelo = Modelo::findOrFail($validated['modelo_id']);

        $validated['marca_id'] = $modelo->marca_id;
        $validated['familia_id'] = $modelo->familia_id;
        $validated['categoria_id'] = $modelo->categoria_id;
        $validated['empresa_id'] = $validated['empresa_id'] ?? 1;
        $validated['sucursal_id'] = $validated['sucursal_id'] ?? 1;
        $validated['precio_mayoreo'] = $validated['precio_mayoreo'] ?? 0;
        $validated['usa_inventario'] = $request->boolean('usa_inventario', true);
        $validated['stock'] = isset($validated['stock']) ? (float) $validated['stock'] : 0;
        $validated['stock_minimo'] = isset($validated['stock_minimo']) ? (float) $validated['stock_minimo'] : 0;
        $validated['aplica_impuesto_adicional'] = $request->boolean('aplica_impuesto_adicional', false);
        $validated['aplica_retencion'] = $request->boolean('aplica_retencion', false);
        $validated['precio_incluye_impuestos'] = $request->boolean('precio_incluye_impuestos', true);

        $producto = Producto::create($validated);

        // Registrar automáticamente en Kardex el inventario inicial si aplica
        if ($producto->usa_inventario && $producto->stock > 0) {
            InventoryMovement::create([
                'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
                'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => auth()->id(),
                'tipo' => 'entrada',
                'motivo' => __('Inventario Inicial de Registro'),
                'cantidad' => (float) $producto->stock,
                'stock_anterior' => 0,
                'stock_nuevo' => (float) $producto->stock,
                'costo_unitario' => (float) $producto->precio_compra,
                'referencia' => 'ALTA-' . $producto->sku,
                'notas' => __('Registro de stock inicial al crear el producto en el catálogo.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Producto creado correctamente.'),
        ]);
    }

    /**
     * Update the specified product/variant in storage.
     */
    public function update(Request $request, Producto $producto)
    {
        $validated = $request->validate([
            'modelo_id' => 'required|exists:modelos,id',
            'sku' => 'required|string|max:100|unique:productos,sku,' . $producto->id,
            'codigo_barras' => 'nullable|string|max:100|unique:productos,codigo_barras,' . $producto->id,
            'nombre_variante' => 'required|string|max:255',
            'condicion' => 'required|string|in:nuevo,usado,reacondicionado,repuesto',
            'tipo_venta' => 'required|string|in:unidad,granel,paquete',
            'usa_inventario' => 'boolean',
            'variant_specs' => 'nullable|array',
            'precio_compra' => 'required|numeric|min:0',
            'precio_venta' => 'required|numeric|min:0',
            'precio_mayoreo' => 'nullable|numeric|min:0',
            'stock' => 'required_if:usa_inventario,true|nullable|numeric|min:0',
            'stock_minimo' => 'required_if:usa_inventario,true|nullable|numeric|min:0',
            'tipo_impuesto' => 'required|string|in:gravado,exento,tasa_cero',
            'tasa_iva' => 'nullable|numeric|min:0',
            'aplica_impuesto_adicional' => 'boolean',
            'tasa_impuesto_adicional' => 'nullable|numeric|min:0',
            'aplica_retencion' => 'boolean',
            'tasa_retencion' => 'nullable|numeric|min:0',
            'precio_incluye_impuestos' => 'boolean',
            'clave_sat_producto' => 'nullable|string|max:20',
            'clave_sat_unidad' => 'nullable|string|max:20',
            'objeto_impuesto_sat' => 'nullable|string|max:5',
            'estado' => 'boolean',
        ], [
            'stock.required' => __('La cantidad actual (stock) es obligatoria.'),
            'stock.required_if' => __('Debe ingresar la cantidad actual de stock.'),
            'stock.numeric' => __('La cantidad de stock debe ser un número válido.'),
            'stock.min' => __('El stock no puede ser negativo.'),
        ]);

        $modelo = Modelo::findOrFail($validated['modelo_id']);

        $validated['marca_id'] = $modelo->marca_id;
        $validated['familia_id'] = $modelo->familia_id;
        $validated['categoria_id'] = $modelo->categoria_id;
        $validated['precio_mayoreo'] = $validated['precio_mayoreo'] ?? 0;
        $validated['usa_inventario'] = $request->boolean('usa_inventario', true);
        $validated['stock'] = isset($validated['stock']) ? (float) $validated['stock'] : 0;
        $validated['stock_minimo'] = isset($validated['stock_minimo']) ? (float) $validated['stock_minimo'] : 0;
        $validated['aplica_impuesto_adicional'] = $request->boolean('aplica_impuesto_adicional', false);
        $validated['aplica_retencion'] = $request->boolean('aplica_retencion', false);
        $validated['precio_incluye_impuestos'] = $request->boolean('precio_incluye_impuestos', true);

        $stockAnterior = (float) $producto->stock;
        $producto->update($validated);
        $stockNuevo = (float) $producto->stock;

        // Registrar en Kardex si hubo un cambio directo en la cantidad de stock
        if ($producto->usa_inventario && $stockAnterior !== $stockNuevo) {
            $diferencia = $stockNuevo - $stockAnterior;
            $tipo = $diferencia > 0 ? 'entrada' : 'salida';

            InventoryMovement::create([
                'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
                'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => auth()->id(),
                'tipo' => $tipo,
                'motivo' => __('Ajuste Directo (Edición de Producto)'),
                'cantidad' => abs($diferencia),
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'costo_unitario' => (float) $producto->precio_compra,
                'referencia' => 'EDIT-' . $producto->sku,
                'notas' => __('Modificación manual de cantidad realizada desde el catálogo de productos.'),
            ]);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Producto actualizado correctamente.'),
        ]);
    }

    /**
     * Remove the specified product/variant from storage.
     */
    public function destroy(Producto $producto)
    {
        $producto->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Producto eliminado correctamente.'),
        ]);
    }

    /**
     * Quick stock addition from POS terminal when product stock is 0.
     */
    public function quickStock(Request $request, Producto $producto)
    {
        $validated = $request->validate([
            'cantidad' => 'required|numeric|gt:0',
        ]);

        $cantidad = (float) $validated['cantidad'];
        $stockAnterior = (float) $producto->stock;
        $stockNuevo = $stockAnterior + $cantidad;

        $producto->update(['stock' => $stockNuevo]);

        if ($producto->usa_inventario) {
            InventoryMovement::create([
                'empresa_id' => $producto->empresa_id ?? auth()->user()?->empresa_id,
                'sucursal_id' => $producto->sucursal_id ?? auth()->user()?->sucursal_id,
                'producto_id' => $producto->id,
                'user_id' => auth()->id(),
                'tipo' => 'entrada',
                'motivo' => __('Ingreso Rápido en Venta POS'),
                'cantidad' => $cantidad,
                'stock_anterior' => $stockAnterior,
                'stock_nuevo' => $stockNuevo,
                'costo_unitario' => (float) $producto->precio_compra,
                'referencia' => 'POS-STOCK-' . $producto->sku,
                'notas' => __('Ingreso de existencia realizado directamente desde la Terminal POS al intentar vender producto sin stock.'),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => __('Stock actualizado correctamente.'),
            'stock' => $stockNuevo,
            'producto' => [
                'id' => $producto->id,
                'stock' => $stockNuevo,
            ],
        ]);
    }
}
