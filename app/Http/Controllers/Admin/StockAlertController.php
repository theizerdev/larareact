<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StockAlertController extends Controller
{
    /**
     * Mostrar el listado de productos con stock bajo.
     */
    public function index(Request $request)
    {
        $empresaId   = $request->user()->empresa_id;
        $sucursalId  = $request->user()->sucursal_id;

        $products = Producto::query()
            ->with(['categoria', 'marca'])
            ->where('empresa_id', $empresaId)
            ->where('sucursal_id', $sucursalId)
            ->where('usa_inventario', true)
            ->where('estado', true)
            ->where('stock_minimo', '>', 0)
            ->whereColumn('stock', '<=', 'stock_minimo')
            ->orderByRaw('(stock / NULLIF(stock_minimo, 0)) ASC')  // Más críticos primero
            ->get()
            ->map(function ($p) {
                $ratio = $p->stock_minimo > 0 ? ($p->stock / $p->stock_minimo) : 1;

                if ($p->stock <= 0) {
                    $severidad = 'agotado';
                } elseif ($ratio <= 0.25) {
                    $severidad = 'critico';
                } elseif ($ratio <= 0.5) {
                    $severidad = 'bajo';
                } else {
                    $severidad = 'alerta';
                }

                return [
                    'id'             => $p->id,
                    'nombre'         => $p->nombre_variante,
                    'sku'            => $p->sku,
                    'codigo_barras'  => $p->codigo_barras,
                    'categoria'      => $p->categoria?->nombre,
                    'marca'          => $p->marca?->nombre,
                    'stock'          => $p->stock,
                    'stock_minimo'   => $p->stock_minimo,
                    'severidad'      => $severidad,
                    'ratio'          => round($ratio * 100),
                ];
            });

        $resumen = [
            'agotado' => $products->where('severidad', 'agotado')->count(),
            'critico' => $products->where('severidad', 'critico')->count(),
            'bajo'    => $products->where('severidad', 'bajo')->count(),
            'alerta'  => $products->where('severidad', 'alerta')->count(),
            'total'   => $products->count(),
        ];

        return Inertia::render('admin/PointOfSale/StockAlerts/Index', [
            'products' => $products,
            'resumen'  => $resumen,
        ]);
    }

    /**
     * API JSON para polling rápido del badge de alertas.
     */
    public function count(Request $request)
    {
        $count = Producto::query()
            ->where('empresa_id', $request->user()->empresa_id)
            ->where('sucursal_id', $request->user()->sucursal_id)
            ->where('usa_inventario', true)
            ->where('estado', true)
            ->where('stock_minimo', '>', 0)
            ->whereColumn('stock', '<=', 'stock_minimo')
            ->count();

        return response()->json(['count' => $count]);
    }
}
