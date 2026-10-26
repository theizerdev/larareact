<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Producto;
use App\Models\Sucursal;
use App\Services\StockAlertPdfService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Inertia\Inertia;

class StockAlertController extends Controller
{
    /**
     * Mostrar el listado de productos con stock bajo agrupados por marcas.
     */
    public function index(Request $request)
    {
        $dataset = $this->buildLowStockDataset($request, false);

        return Inertia::render('admin/PointOfSale/StockAlerts/Index', [
            'products' => $dataset['products'],
            'brandGroups' => $dataset['brandGroups'],
            'resumen' => $dataset['resumen'],
        ]);
    }

    /**
     * Exportar reporte profesional en PDF de productos con stock bajo agrupados por marcas.
     */
    public function exportPdf(Request $request, StockAlertPdfService $pdfService): Response
    {
        $user = $request->user();
        $dataset = $this->buildLowStockDataset($request, true);

        $empresa = $user?->empresa_id
            ? Empresa::withoutGlobalScope('multitenancy')->with('pais')->find($user->empresa_id)
            : null;

        $sucursal = $user?->sucursal_id
            ? Sucursal::withoutGlobalScope('multitenancy')->find($user->sucursal_id)
            : null;

        $timezone = method_exists($user, 'getTimezone')
            ? $user->getTimezone()
            : ($empresa?->getTimezone() ?? config('app.timezone', 'America/Mexico_City'));

        $now = now()->timezone($timezone);
        $currencySymbol = $empresa?->pais?->simbolo_moneda ?? '$';

        $pdfBinary = $pdfService->generate(
            brandGroups: $dataset['brandGroups'],
            resumen: $dataset['resumen'],
            empresa: $empresa,
            sucursal: $sucursal,
            user: $user,
            meta: [
                'currencySymbol' => $currencySymbol,
                'generatedAt' => $now->format('d/m/Y H:i'),
                'folio' => 'ALT-' . $now->format('Ymd-Hi'),
                'filterLabel' => $dataset['filterLabel'],
            ]
        );

        $companySlug = Str::slug($empresa?->nombre_comercial ?: ($empresa?->razon_social ?: 'inventario'), '_');
        $marcaFilter = trim((string) $request->query('marca', ''));
        $brandSuffix = '';
        if ($marcaFilter !== '' && $marcaFilter !== 'all') {
            $brandSuffix = '_' . Str::slug($marcaFilter === '__sin_marca__' ? 'sin_marca' : $marcaFilter, '_');
        }

        $fileName = sprintf(
            'Stock_Bajo_Por_Marcas_%s%s_%s.pdf',
            $companySlug ?: 'inventario',
            $brandSuffix,
            $now->format('Y-m-d')
        );

        $disposition = ($request->boolean('preview') || $request->boolean('inline')) ? 'inline' : 'attachment';

        return response($pdfBinary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$disposition}; filename=\"{$fileName}\"",
            'Content-Length' => (string) strlen($pdfBinary),
            'Cache-Control' => 'private, no-transform, no-store, must-revalidate',
        ]);
    }

    /**
     * API JSON para polling rápido del badge de alertas.
     */
    public function count(Request $request)
    {
        $empresaId = $request->user()?->empresa_id;
        $sucursalId = $request->user()?->sucursal_id;

        $count = Producto::query()
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn ($q) => $q->where('sucursal_id', $sucursalId))
            ->where('usa_inventario', true)
            ->where('estado', true)
            ->where('stock_minimo', '>', 0)
            ->whereColumn('stock', '<=', 'stock_minimo')
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Construir el listado normalizado, resumen ejecutivo y agrupación por marcas.
     *
     * @return array{
     *     products: array<int, array<string, mixed>>,
     *     brandGroups: array<int, array<string, mixed>>,
     *     resumen: array<string, mixed>,
     *     filterLabel: string
     * }
     */
    private function buildLowStockDataset(Request $request, bool $applyQueryFilters = false): array
    {
        $empresaId = $request->user()?->empresa_id;
        $sucursalId = $request->user()?->sucursal_id;

        $rawProducts = Producto::query()
            ->with([
                'categoria' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'marca' => fn ($q) => $q->withoutGlobalScope('multitenancy'),
                'modelo' => fn ($q) => $q->withoutGlobalScope('multitenancy')->with([
                    'marca' => fn ($mq) => $mq->withoutGlobalScope('multitenancy'),
                    'categoria' => fn ($mq) => $mq->withoutGlobalScope('multitenancy'),
                ]),
            ])
            ->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))
            ->when($sucursalId, fn ($q) => $q->where('sucursal_id', $sucursalId))
            ->where('usa_inventario', true)
            ->where('estado', true)
            ->where('stock_minimo', '>', 0)
            ->whereColumn('stock', '<=', 'stock_minimo')
            ->orderByRaw('(stock / NULLIF(stock_minimo, 0)) ASC')
            ->orderBy('nombre_variante')
            ->get();

        $products = $rawProducts->map(function (Producto $p): array {
            $marcaObj = $p->marca ?? $p->modelo?->marca;
            $categoriaObj = $p->categoria ?? $p->modelo?->categoria;

            $marcaNombre = trim((string) ($marcaObj?->nombre ?? '')) ?: null;
            $categoriaNombre = trim((string) ($categoriaObj?->nombre ?? '')) ?: null;
            $modeloNombre = trim((string) ($p->modelo?->nombre_comercial ?? '')) ?: null;
            $nombre = trim((string) ($p->nombre_variante ?? '')) ?: ($modeloNombre ?: ('Producto #' . $p->id));

            $stock = (float) $p->stock;
            $stockMinimo = (float) $p->stock_minimo;
            $faltante = (float) max(0, $stockMinimo - $stock);
            $precioCompra = (float) ($p->precio_compra ?? 0);
            $precioVenta = (float) ($p->precio_venta ?? 0);
            $costoReposicion = round($faltante * $precioCompra, 2);

            $ratio = $stockMinimo > 0 ? ($stock / $stockMinimo) : 1.0;

            if ($stock <= 0) {
                $severidad = 'agotado';
            } elseif ($ratio <= 0.25) {
                $severidad = 'critico';
            } elseif ($ratio <= 0.5) {
                $severidad = 'bajo';
            } else {
                $severidad = 'alerta';
            }

            return [
                'id' => $p->id,
                'nombre' => $nombre,
                'sku' => $p->sku,
                'codigo_barras' => $p->codigo_barras,
                'categoria' => $categoriaNombre,
                'modelo' => $modeloNombre,
                'marca' => $marcaNombre,
                'marca_id' => $marcaObj?->id,
                'marca_logo' => $marcaObj?->logo_url,
                'tipo_producto' => $p->tipo_producto ?? ($p->condicion === 'repuesto' ? 'repuesto' : 'venta'),
                'stock' => $stock,
                'stock_minimo' => $stockMinimo,
                'faltante' => $faltante,
                'precio_compra' => $precioCompra,
                'precio_venta' => $precioVenta,
                'costo_reposicion' => $costoReposicion,
                'severidad' => $severidad,
                'ratio' => (int) round(max(0, $ratio) * 100),
            ];
        });

        $filterParts = [];

        if ($applyQueryFilters) {
            $marcaParam = trim((string) $request->query('marca', ''));
            if ($marcaParam !== '' && $marcaParam !== 'all') {
                if ($marcaParam === '__sin_marca__' || mb_strtolower($marcaParam, 'UTF-8') === 'sin marca') {
                    $products = $products->filter(fn (array $item) => $item['marca'] === null)->values();
                    $filterParts[] = 'Marca: Sin Marca';
                } else {
                    $needle = mb_strtolower($marcaParam, 'UTF-8');
                    $products = $products->filter(function (array $item) use ($needle, $marcaParam) {
                        if ($item['marca'] !== null && mb_strtolower((string) $item['marca'], 'UTF-8') === $needle) {
                            return true;
                        }

                        return $item['marca_id'] !== null && (string) $item['marca_id'] === $marcaParam;
                    })->values();
                    $matchedLabel = $products->first()['marca'] ?? $marcaParam;
                    $filterParts[] = 'Marca: ' . $matchedLabel;
                }
            }

            $severidadParam = trim((string) $request->query('severidad', ''));
            if (in_array($severidadParam, ['agotado', 'critico', 'bajo', 'alerta'], true)) {
                $products = $products->where('severidad', $severidadParam)->values();
                $sevLabels = [
                    'agotado' => 'Agotados',
                    'critico' => 'Críticos',
                    'bajo' => 'Stock Bajo',
                    'alerta' => 'En Alerta',
                ];
                $filterParts[] = 'Nivel: ' . $sevLabels[$severidadParam];
            }

            $searchParam = trim((string) $request->query('search', ''));
            if ($searchParam !== '') {
                $q = mb_strtolower($searchParam, 'UTF-8');
                $products = $products->filter(function (array $item) use ($q) {
                    $haystack = implode(' ', array_filter([
                        $item['nombre'] ?? '',
                        $item['sku'] ?? '',
                        $item['codigo_barras'] ?? '',
                        $item['categoria'] ?? '',
                        $item['marca'] ?? '',
                        $item['modelo'] ?? '',
                    ]));

                    return str_contains(mb_strtolower($haystack, 'UTF-8'), $q);
                })->values();
                $filterParts[] = 'Búsqueda: "' . $searchParam . '"';
            }
        }

        // Group products by normalized brand key
        $grouped = $products->groupBy(function (array $item): string {
            if ($item['marca'] === null || trim((string) $item['marca']) === '') {
                return '__sin_marca__';
            }

            return mb_strtolower(trim((string) $item['marca']), 'UTF-8');
        });

        $brandGroups = $grouped->map(function ($items, string $groupKey): array {
            $sortedItems = $items->sort(function (array $a, array $b): int {
                if ($a['ratio'] !== $b['ratio']) {
                    return $a['ratio'] <=> $b['ratio'];
                }
                if ($a['stock'] !== $b['stock']) {
                    return $a['stock'] <=> $b['stock'];
                }

                return strnatcasecmp((string) $a['nombre'], (string) $b['nombre']);
            })->values();

            $first = $sortedItems->first();
            $isSinMarca = ($groupKey === '__sin_marca__');
            $marcaDisplay = $isSinMarca ? 'Sin Marca' : (string) ($first['marca'] ?? 'Sin Marca');

            return [
                'key' => $groupKey,
                'marca' => $marcaDisplay,
                'marca_id' => $isSinMarca ? null : ($first['marca_id'] ?? null),
                'marca_logo' => $isSinMarca ? null : ($first['marca_logo'] ?? null),
                'sin_marca' => $isSinMarca,
                'total_productos' => $sortedItems->count(),
                'agotados' => $sortedItems->where('severidad', 'agotado')->count(),
                'criticos' => $sortedItems->where('severidad', 'critico')->count(),
                'bajos' => $sortedItems->where('severidad', 'bajo')->count(),
                'alertas' => $sortedItems->where('severidad', 'alerta')->count(),
                'unidades_faltantes' => (float) $sortedItems->sum('faltante'),
                'costo_reposicion' => round((float) $sortedItems->sum('costo_reposicion'), 2),
                'products' => $sortedItems->all(),
            ];
        })->values()->all();

        $sortMode = (string) $request->query('sort_brands', 'az');
        usort($brandGroups, function (array $a, array $b) use ($sortMode): int {
            // Always place "Sin Marca" at the very bottom
            if ($a['sin_marca'] !== $b['sin_marca']) {
                return $a['sin_marca'] ? 1 : -1;
            }

            if (in_array($sortMode, ['urgency', 'urgencia'], true)) {
                if ($a['agotados'] !== $b['agotados']) {
                    return $b['agotados'] <=> $a['agotados'];
                }
                if ($a['criticos'] !== $b['criticos']) {
                    return $b['criticos'] <=> $a['criticos'];
                }
                if ($a['total_productos'] !== $b['total_productos']) {
                    return $b['total_productos'] <=> $a['total_productos'];
                }
            } elseif (in_array($sortMode, ['count', 'cantidad'], true)) {
                if ($a['total_productos'] !== $b['total_productos']) {
                    return $b['total_productos'] <=> $a['total_productos'];
                }
                if ($a['agotados'] !== $b['agotados']) {
                    return $b['agotados'] <=> $a['agotados'];
                }
            }

            return strnatcasecmp((string) $a['marca'], (string) $b['marca']);
        });

        $resumen = [
            'agotado' => $products->where('severidad', 'agotado')->count(),
            'critico' => $products->where('severidad', 'critico')->count(),
            'bajo' => $products->where('severidad', 'bajo')->count(),
            'alerta' => $products->where('severidad', 'alerta')->count(),
            'total' => $products->count(),
            'total_marcas' => count($brandGroups),
            'unidades_faltantes' => (float) $products->sum('faltante'),
            'costo_estimado_reposicion' => round((float) $products->sum('costo_reposicion'), 2),
        ];

        return [
            'products' => $products->values()->all(),
            'brandGroups' => $brandGroups,
            'resumen' => $resumen,
            'filterLabel' => ! empty($filterParts)
                ? implode(' • ', $filterParts)
                : 'Catálogo Completo en Alerta',
        ];
    }
}
