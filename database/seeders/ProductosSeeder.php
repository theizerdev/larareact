<?php

namespace Database\Seeders;

use App\Models\Modelo;
use App\Models\Producto;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductosSeeder extends Seeder
{
    /**
     * Run the database seeds for physical products and variants.
     */
    public function run(): void
    {
        $modelos = Modelo::with(['marca', 'familia', 'categoria'])->get();

        if ($modelos->isEmpty()) {
            return;
        }

        // Variantes predefinidas por modelo clave con atributos en JSON y precio_mayoreo
        $productosData = [
            // --- SAMSUNG GALAXY S24 ULTRA ---
            'Galaxy S24 Ultra' => [
                [
                    'sku' => 'SAM-S24U-12-256-BLK',
                    'precio_compra' => 950.00,
                    'precio_venta' => 1199.99,
                    'precio_mayoreo' => 1099.99,
                    'stock' => 15,
                    'stock_minimo' => 3,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Titanium Black',
                    ],
                ],
                [
                    'sku' => 'SAM-S24U-12-512-GRY',
                    'precio_compra' => 1080.00,
                    'precio_venta' => 1349.99,
                    'precio_mayoreo' => 1249.99,
                    'stock' => 8,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Titanium Gray',
                    ],
                ],
                [
                    'sku' => 'SAM-S24U-16-1T-VLT',
                    'precio_compra' => 1300.00,
                    'precio_venta' => 1599.99,
                    'precio_mayoreo' => 1480.00,
                    'stock' => 3,
                    'stock_minimo' => 1,
                    'variant_specs' => [
                        'RAM' => '16GB',
                        'Almacenamiento' => '1TB',
                        'Color' => 'Titanium Violet',
                    ],
                ],
            ],

            // --- IPHONE 15 PRO MAX ---
            'iPhone 15 Pro Max' => [
                [
                    'sku' => 'APL-IP15PM-8-256-NAT',
                    'precio_compra' => 1050.00,
                    'precio_venta' => 1299.99,
                    'precio_mayoreo' => 1199.99,
                    'stock' => 12,
                    'stock_minimo' => 3,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Titanio Natural',
                    ],
                ],
                [
                    'sku' => 'APL-IP15PM-8-512-BLU',
                    'precio_compra' => 1200.00,
                    'precio_venta' => 1499.99,
                    'precio_mayoreo' => 1380.00,
                    'stock' => 6,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Titanio Azul',
                    ],
                ],
                [
                    'sku' => 'APL-IP15PM-8-1T-BLK',
                    'precio_compra' => 1400.00,
                    'precio_venta' => 1699.99,
                    'precio_mayoreo' => 1550.00,
                    'stock' => 2,
                    'stock_minimo' => 1,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '1TB',
                        'Color' => 'Titanio Negro',
                    ],
                ],
            ],

            // --- XIAOMI REDMI NOTE 13 PRO+ 5G ---
            'Redmi Note 13 Pro+ 5G' => [
                [
                    'sku' => 'XIA-RN13P-8-256-BLK',
                    'precio_compra' => 320.00,
                    'precio_venta' => 429.99,
                    'precio_mayoreo' => 380.00,
                    'stock' => 25,
                    'stock_minimo' => 5,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Midnight Black',
                    ],
                ],
                [
                    'sku' => 'XIA-RN13P-12-512-PRP',
                    'precio_compra' => 390.00,
                    'precio_venta' => 499.99,
                    'precio_mayoreo' => 449.99,
                    'stock' => 18,
                    'stock_minimo' => 4,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Aurora Purple',
                    ],
                ],
            ],

            // --- POCO X6 PRO 5G ---
            'POCO X6 Pro 5G' => [
                [
                    'sku' => 'XIA-POCOX6P-8-256-YEL',
                    'precio_compra' => 280.00,
                    'precio_venta' => 369.99,
                    'precio_mayoreo' => 330.00,
                    'stock' => 20,
                    'stock_minimo' => 4,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Yellow',
                    ],
                ],
                [
                    'sku' => 'XIA-POCOX6P-12-512-BLK',
                    'precio_compra' => 340.00,
                    'precio_venta' => 439.99,
                    'precio_mayoreo' => 390.00,
                    'stock' => 14,
                    'stock_minimo' => 3,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Black',
                    ],
                ],
            ],

            // --- MOTOROLA EDGE 50 PRO ---
            'Edge 50 Pro' => [
                [
                    'sku' => 'MOT-ED50P-12-512-BLK',
                    'precio_compra' => 480.00,
                    'precio_venta' => 649.99,
                    'precio_mayoreo' => 580.00,
                    'stock' => 10,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Black Beauty (Cuero Vegano)',
                    ],
                ],
            ],

            // --- HONOR MAGIC6 PRO 5G ---
            'Magic6 Pro 5G' => [
                [
                    'sku' => 'HON-M6P-12-512-GRN',
                    'precio_compra' => 850.00,
                    'precio_venta' => 1099.99,
                    'precio_mayoreo' => 980.00,
                    'stock' => 7,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Epi Green (Cuero Vegano)',
                    ],
                ],
                [
                    'sku' => 'HON-M6P-16-1T-BLK',
                    'precio_compra' => 1020.00,
                    'precio_venta' => 1299.99,
                    'precio_mayoreo' => 1150.00,
                    'stock' => 4,
                    'stock_minimo' => 1,
                    'variant_specs' => [
                        'RAM' => '16GB',
                        'Almacenamiento' => '1TB',
                        'Color' => 'Black',
                    ],
                ],
            ],

            // --- IPAD AIR 6 ---
            'iPad Air 6 11"' => [
                [
                    'sku' => 'APL-IPADA6-128-GRY',
                    'precio_compra' => 490.00,
                    'precio_venta' => 599.99,
                    'precio_mayoreo' => 540.00,
                    'stock' => 15,
                    'stock_minimo' => 3,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '128GB',
                        'Color' => 'Space Gray',
                    ],
                ],
                [
                    'sku' => 'APL-IPADA6-256-STL',
                    'precio_compra' => 580.00,
                    'precio_venta' => 699.99,
                    'precio_mayoreo' => 640.00,
                    'stock' => 9,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'RAM' => '8GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Starlight',
                    ],
                ],
            ],

            // --- GALAXY TAB S9 ULTRA ---
            'Galaxy Tab S9 Ultra' => [
                [
                    'sku' => 'SAM-TABS9U-12-256-GRP',
                    'precio_compra' => 900.00,
                    'precio_venta' => 1199.99,
                    'precio_mayoreo' => 1050.00,
                    'stock' => 5,
                    'stock_minimo' => 1,
                    'variant_specs' => [
                        'RAM' => '12GB',
                        'Almacenamiento' => '256GB',
                        'Color' => 'Graphite',
                    ],
                ],
                [
                    'sku' => 'SAM-TABS9U-16-512-BGE',
                    'precio_compra' => 1050.00,
                    'precio_venta' => 1349.99,
                    'precio_mayoreo' => 1200.00,
                    'stock' => 3,
                    'stock_minimo' => 1,
                    'variant_specs' => [
                        'RAM' => '16GB',
                        'Almacenamiento' => '512GB',
                        'Color' => 'Beige',
                    ],
                ],
            ],

            // --- APPLE WATCH ULTRA 2 ---
            'Apple Watch Ultra 2 (49mm)' => [
                [
                    'sku' => 'APL-WATCHU2-64-ALP',
                    'precio_compra' => 650.00,
                    'precio_venta' => 799.99,
                    'precio_mayoreo' => 720.00,
                    'stock' => 8,
                    'stock_minimo' => 2,
                    'variant_specs' => [
                        'Almacenamiento' => '64GB',
                        'Color' => 'Titanio Natural (Loop Alpina)',
                    ],
                ],
            ],

            // --- GALAXY WATCH6 CLASSIC ---
            'Galaxy Watch6 Classic (47mm)' => [
                [
                    'sku' => 'SAM-WATCH6C-16-BLK',
                    'precio_compra' => 290.00,
                    'precio_venta' => 399.99,
                    'precio_mayoreo' => 340.00,
                    'stock' => 12,
                    'stock_minimo' => 3,
                    'variant_specs' => [
                        'RAM' => '2GB',
                        'Almacenamiento' => '16GB',
                        'Color' => 'Black (BT)',
                    ],
                ],
            ],
        ];

        foreach ($modelos as $modelo) {
            $nombreMod = $modelo->nombre_comercial;

            if (isset($productosData[$nombreMod])) {
                foreach ($productosData[$nombreMod] as $p) {
                    $nombreVariante = $modelo->marca->nombre . ' ' . $modelo->nombre_comercial;
                    $subSpecs = array_values($p['variant_specs']);

                    if (count($subSpecs) > 0) {
                        $nombreVariante .= ' (' . implode(' / ', $subSpecs) . ')';
                    }

                    $skuFinal = $modelo->empresa_id > 1 ? ($p['sku'] . '-E' . $modelo->empresa_id) : $p['sku'];

                    Producto::updateOrCreate(
                        [
                            'sku' => $skuFinal,
                        ],
                        [
                            'categoria_id' => $modelo->categoria_id,
                            'marca_id' => $modelo->marca_id,
                            'familia_id' => $modelo->familia_id,
                            'modelo_id' => $modelo->id,
                            'empresa_id' => $modelo->empresa_id,
                            'sucursal_id' => $modelo->sucursal_id ?? 1,
                            'codigo_barras' => '779' . rand(100000000, 999999999),
                            'nombre_variante' => $nombreVariante,
                            'condicion' => 'nuevo',
                            'variant_specs' => $p['variant_specs'],
                            'precio_compra' => $p['precio_compra'],
                            'precio_venta' => $p['precio_venta'],
                            'precio_mayoreo' => $p['precio_mayoreo'],
                            'stock' => $p['stock'],
                            'stock_minimo' => $p['stock_minimo'],
                            'estado' => true,
                        ]
                    );
                }
            } else {
                // Crear al menos 1 producto genérico para cualquier modelo no listado
                $empSuffix = $modelo->empresa_id > 1 ? ('-E' . $modelo->empresa_id) : '';
                $skuGen = strtoupper(substr($modelo->marca->nombre, 0, 3)) . '-' . Str::slug($modelo->nombre_comercial) . $empSuffix . '-GEN';
                $ramGen = rand(0, 1) === 1 ? '8GB' : '12GB';
                $almacenamientoGen = rand(0, 1) === 1 ? '128GB' : '256GB';

                $pCompra = rand(150, 600);
                $pVenta = $pCompra + 150;
                $pMayoreo = $pCompra + 80;

                Producto::updateOrCreate(
                    [
                        'sku' => $skuGen,
                    ],
                    [
                        'categoria_id' => $modelo->categoria_id,
                        'marca_id' => $modelo->marca_id,
                        'familia_id' => $modelo->familia_id,
                        'modelo_id' => $modelo->id,
                        'empresa_id' => $modelo->empresa_id,
                        'sucursal_id' => $modelo->sucursal_id ?? 1,
                        'codigo_barras' => '779' . rand(100000000, 999999999),
                        'nombre_variante' => $modelo->marca->nombre . ' ' . $modelo->nombre_comercial . " ({$ramGen} / {$almacenamientoGen})",
                        'condicion' => 'nuevo',
                        'variant_specs' => [
                            'RAM' => $ramGen,
                            'Almacenamiento' => $almacenamientoGen,
                            'Color' => 'Negro',
                        ],
                        'precio_compra' => $pCompra,
                        'precio_venta' => $pVenta,
                        'precio_mayoreo' => $pMayoreo,
                        'stock' => rand(3, 20),
                        'stock_minimo' => 2,
                        'estado' => true,
                    ]
                );
            }
        }
    }
}
