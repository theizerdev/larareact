<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EquiposInicialSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Categorías
        $catSmartphoneId = DB::table('categorias')->insertGetId([
            'nombre' => 'Smartphone',
            'slug' => 'smartphone',
            'icono' => 'smartphone',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);

        $catTabletId = DB::table('categorias')->insertGetId([
            'nombre' => 'Tablet',
            'slug' => 'tablet',
            'icono' => 'tablet',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);

        $catWatchId = DB::table('categorias')->insertGetId([
            'nombre' => 'Smartwatch',
            'slug' => 'smartwatch',
            'icono' => 'watch',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);

        // 2. Marcas
        $marcas = [
            'Apple' => 'apple',
            'Samsung' => 'samsung',
            'Xiaomi' => 'xiaomi',
            'Motorola' => 'motorola',
            'Huawei' => 'huawei',
            'Honor' => 'honor',
            'OPPO' => 'oppo',
            'Realme' => 'realme',
            'Infinix' => 'infinix',
            'Tecno' => 'tecno',
        ];

        $marcaIds = [];
        foreach ($marcas as $nombre => $slug) {
            $marcaIds[$nombre] = DB::table('marcas')->insertGetId([
                'nombre' => $nombre,
                'slug' => $slug,
                'estado' => true,
                'created_at' => now(),
                'empresa_id' => 1,
                'sucursal_id' => 1,
                'updated_at' => now(),
            ]);
        }

        // 3. Estructura completa de Familias y Modelos por Marca y Categoría

        $catalogo = [
            // --- APPLE ---
            'Apple' => [
                // Smartphones
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'iPhone Serie 14',
                    'descripcion' => 'Gama de iPhones del 2022 con Dynamic Island en Pro',
                    'modelos' => [
                        ['nombre' => 'iPhone 14', 'codigo' => 'A2882 / A2649'],
                        ['nombre' => 'iPhone 14 Plus', 'codigo' => 'A2886 / A2632'],
                        ['nombre' => 'iPhone 14 Pro', 'codigo' => 'A2890 / A2650'],
                        ['nombre' => 'iPhone 14 Pro Max', 'codigo' => 'A2894 / A2651'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'iPhone Serie 15',
                    'descripcion' => 'Línea de iPhones con puerto USB-C y titanio en Pro',
                    'modelos' => [
                        ['nombre' => 'iPhone 15', 'codigo' => 'A3090'],
                        ['nombre' => 'iPhone 15 Plus', 'codigo' => 'A3094'],
                        ['nombre' => 'iPhone 15 Pro', 'codigo' => 'A3102'],
                        ['nombre' => 'iPhone 15 Pro Max', 'codigo' => 'A3106'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'iPhone Serie 13',
                    'descripcion' => 'Serie de iPhones lanzados en 2021',
                    'modelos' => [
                        ['nombre' => 'iPhone 13 Mini', 'codigo' => 'A2631'],
                        ['nombre' => 'iPhone 13', 'codigo' => 'A2633'],
                        ['nombre' => 'iPhone 13 Pro', 'codigo' => 'A2636'],
                        ['nombre' => 'iPhone 13 Pro Max', 'codigo' => 'A2638'],
                    ],
                ],
                // Tablets
                [
                    'categoria_id' => $catTabletId,
                    'nombre_familia' => 'iPad Air Series',
                    'descripcion' => 'Línea delgada y potente con chips de la serie M',
                    'modelos' => [
                        ['nombre' => 'iPad Air 5ta Gen (10.9")', 'codigo' => 'A2588 / A2589'],
                        ['nombre' => 'iPad Air 6ta Gen (11")', 'codigo' => 'A2902'],
                        ['nombre' => 'iPad Air 6ta Gen (13")', 'codigo' => 'A2898'],
                    ],
                ],
                [
                    'categoria_id' => $catTabletId,
                    'nombre_familia' => 'iPad Pro Series',
                    'descripcion' => 'Tablets profesionales con pantallas Liquid Retina / OLED',
                    'modelos' => [
                        ['nombre' => 'iPad Pro 11" 4ta Gen', 'codigo' => 'A2759'],
                        ['nombre' => 'iPad Pro 12.9" 6ta Gen', 'codigo' => 'A2436'],
                    ],
                ],
                // Smartwatches
                [
                    'categoria_id' => $catWatchId,
                    'nombre_familia' => 'Apple Watch Series',
                    'descripcion' => 'Relojes inteligentes con sensores de salud avanzados',
                    'modelos' => [
                        ['nombre' => 'Apple Watch Series 8 (41mm/45mm)', 'codigo' => 'A2770 / A2771'],
                        ['nombre' => 'Apple Watch Series 9 (41mm/45mm)', 'codigo' => 'A2978 / A2980'],
                        ['nombre' => 'Apple Watch Ultra 2 (49mm)', 'codigo' => 'A2986'],
                        ['nombre' => 'Apple Watch SE 2da Gen', 'codigo' => 'A2722'],
                    ],
                ],
            ],

            // --- SAMSUNG ---
            'Samsung' => [
                // Smartphones
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Galaxy Serie S',
                    'descripcion' => 'Gama alta de Samsung con cámaras de alta resolución',
                    'modelos' => [
                        ['nombre' => 'Galaxy S23 FE', 'codigo' => 'SM-S711B'],
                        ['nombre' => 'Galaxy S23 Ultra', 'codigo' => 'SM-S918B'],
                        ['nombre' => 'Galaxy S24 5G', 'codigo' => 'SM-S921B'],
                        ['nombre' => 'Galaxy S24+ 5G', 'codigo' => 'SM-S926B'],
                        ['nombre' => 'Galaxy S24 Ultra 5G', 'codigo' => 'SM-S928B'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Galaxy Serie A',
                    'descripcion' => 'Línea gama media y entrada comercial',
                    'modelos' => [
                        ['nombre' => 'Galaxy A05s', 'codigo' => 'SM-A057F'],
                        ['nombre' => 'Galaxy A15 4G/5G', 'codigo' => 'SM-A155F / SM-A156B'],
                        ['nombre' => 'Galaxy A25 5G', 'codigo' => 'SM-A256B'],
                        ['nombre' => 'Galaxy A35 5G', 'codigo' => 'SM-A356B'],
                        ['nombre' => 'Galaxy A55 5G', 'codigo' => 'SM-A556B'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Galaxy Z Plegables',
                    'descripcion' => 'Dispositivos con pantallas plegables',
                    'modelos' => [
                        ['nombre' => 'Galaxy Z Flip5 5G', 'codigo' => 'SM-F731B'],
                        ['nombre' => 'Galaxy Z Fold5 5G', 'codigo' => 'SM-F946B'],
                    ],
                ],
                // Tablets
                [
                    'categoria_id' => $catTabletId,
                    'nombre_familia' => 'Galaxy Tab Serie S',
                    'descripcion' => 'Tablets premium con S-Pen incluido',
                    'modelos' => [
                        ['nombre' => 'Galaxy Tab S9 FE 10.9"', 'codigo' => 'SM-X510'],
                        ['nombre' => 'Galaxy Tab S9 11"', 'codigo' => 'SM-X710'],
                        ['nombre' => 'Galaxy Tab S9 Ultra 14.6"', 'codigo' => 'SM-X910'],
                    ],
                ],
                // Smartwatches
                [
                    'categoria_id' => $catWatchId,
                    'nombre_familia' => 'Galaxy Watch Series',
                    'descripcion' => 'Relojes inteligentes con WearOS',
                    'modelos' => [
                        ['nombre' => 'Galaxy Watch5 Pro (45mm)', 'codigo' => 'SM-R925'],
                        ['nombre' => 'Galaxy Watch6 (40mm/44mm)', 'codigo' => 'SM-R930 / SM-R940'],
                        ['nombre' => 'Galaxy Watch6 Classic (47mm)', 'codigo' => 'SM-R960'],
                    ],
                ],
            ],

            // --- XIAOMI ---
            'Xiaomi' => [
                // Smartphones
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Redmi Note 13 Series',
                    'descripcion' => 'Generación 13 con cámaras de 108MP y 200MP',
                    'modelos' => [
                        ['nombre' => 'Redmi Note 13 4G', 'codigo' => '23129RAA4G'],
                        ['nombre' => 'Redmi Note 13 5G', 'codigo' => '23127PN0CG'],
                        ['nombre' => 'Redmi Note 13 Pro 4G', 'codigo' => '23117RA68G'],
                        ['nombre' => 'Redmi Note 13 Pro 5G', 'codigo' => '2312DRA50G'],
                        ['nombre' => 'Redmi Note 13 Pro+ 5G', 'codigo' => '23090RA98G'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'POCO Serie X / F',
                    'descripcion' => 'Línea orientada al alto rendimiento y gaming',
                    'modelos' => [
                        ['nombre' => 'POCO X6 Pro 5G', 'codigo' => '2311DRK48G'],
                        ['nombre' => 'POCO F5 Pro 5G', 'codigo' => '23013PC75G'],
                        ['nombre' => 'POCO F6 5G', 'codigo' => '24069PC21G'],
                    ],
                ],
                // Tablets
                [
                    'categoria_id' => $catTabletId,
                    'nombre_familia' => 'Xiaomi Pad Series',
                    'descripcion' => 'Tablets para consumo multimedia y productividad',
                    'modelos' => [
                        ['nombre' => 'Redmi Pad SE 11"', 'codigo' => '23073RPBFG'],
                        ['nombre' => 'Xiaomi Pad 6 (11")', 'codigo' => '23043RP34G'],
                    ],
                ],
                // Smartwatches
                [
                    'categoria_id' => $catWatchId,
                    'nombre_familia' => 'Xiaomi Smart Band / Watch',
                    'descripcion' => 'Pulseras de actividad y relojes inteligentes',
                    'modelos' => [
                        ['nombre' => 'Xiaomi Smart Band 8', 'codigo' => 'M2239B1'],
                        ['nombre' => 'Xiaomi Watch S3', 'codigo' => 'M2323W1'],
                    ],
                ],
            ],

            // --- MOTOROLA ---
            'Motorola' => [
                // Smartphones
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Moto G Series',
                    'descripcion' => 'Familia emblemática gama media',
                    'modelos' => [
                        ['nombre' => 'Moto G24 Power', 'codigo' => 'XT2425-1'],
                        ['nombre' => 'Moto G54 5G', 'codigo' => 'XT2343-1'],
                        ['nombre' => 'Moto G84 5G', 'codigo' => 'XT2341-1'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Motorola Edge Series',
                    'descripcion' => 'Línea de diseño curvo y especificaciones premium',
                    'modelos' => [
                        ['nombre' => 'Motorola Edge 40 Neo', 'codigo' => 'XT2307-1'],
                        ['nombre' => 'Motorola Edge 50 Pro', 'codigo' => 'XT2403-2'],
                        ['nombre' => 'Motorola Edge 50 Ultra', 'codigo' => 'XT2401-1'],
                    ],
                ],
            ],

            // --- HONOR ---
            'Honor' => [
                // Smartphones
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Honor X Series',
                    'descripcion' => 'Smartphones ultraresistentes de batería duradera',
                    'modelos' => [
                        ['nombre' => 'Honor X7b', 'codigo' => 'CLK-LX1'],
                        ['nombre' => 'Honor X8b', 'codigo' => 'LLY-LX1'],
                        ['nombre' => 'Honor X9b 5G', 'codigo' => 'ALI-NX1'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Honor Magic Series',
                    'descripcion' => 'Gama alta con tecnología fotográfica avanzada',
                    'modelos' => [
                        ['nombre' => 'Honor Magic6 Lite 5G', 'codigo' => 'BVI-N09'],
                        ['nombre' => 'Honor Magic6 Pro 5G', 'codigo' => 'BVP-N09'],
                    ],
                ],
                // Tablets
                [
                    'categoria_id' => $catTabletId,
                    'nombre_familia' => 'Honor Pad Series',
                    'descripcion' => 'Tablets metálicas para trabajo y estudio',
                    'modelos' => [
                        ['nombre' => 'Honor Pad X9 11.5"', 'codigo' => 'ELN-W09'],
                    ],
                ],
            ],

            // --- TECNO & INFINIX ---
            'Infinix' => [
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Infinix Note Series',
                    'descripcion' => 'Enfocados en carga rápida y rendimiento',
                    'modelos' => [
                        ['nombre' => 'Infinix Note 30 Pro', 'codigo' => 'X678B'],
                        ['nombre' => 'Infinix Note 40 Pro 5G', 'codigo' => 'X6851'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Infinix Hot Series',
                    'descripcion' => 'Gama de entrada competitiva',
                    'modelos' => [
                        ['nombre' => 'Infinix Hot 40 Pro', 'codigo' => 'X6837'],
                    ],
                ],
            ],
            'Tecno' => [
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Tecno Camon Series',
                    'descripcion' => 'Smartphones enfocados en fotografía nocturna y retratos',
                    'modelos' => [
                        ['nombre' => 'Tecno Camon 20 Pro', 'codigo' => 'CK7n'],
                        ['nombre' => 'Tecno Camon 30 Pro 5G', 'codigo' => 'CL8'],
                    ],
                ],
                [
                    'categoria_id' => $catSmartphoneId,
                    'nombre_familia' => 'Tecno Spark Series',
                    'descripcion' => 'Diseño juvenil y gran autonomía',
                    'modelos' => [
                        ['nombre' => 'Tecno Spark 20 Pro+', 'codigo' => 'KJ7'],
                    ],
                ],
            ],
        ];

        // Insertar en la base de datos
        foreach ($catalogo as $marcaNombre => $familiasArray) {
            if (!isset($marcaIds[$marcaNombre])) continue;

            $marcaId = $marcaIds[$marcaNombre];

            foreach ($familiasArray as $famData) {
                $famId = DB::table('familias')->insertGetId([
                    'marca_id' => $marcaId,
                    'categoria_id' => $famData['categoria_id'],
                    'nombre' => $famData['nombre_familia'],
                    'descripcion' => $famData['descripcion'],
                    'estado' => true,
                    'created_at' => now(),
                    'empresa_id' => 1,
                    'sucursal_id' => 1,
                    'updated_at' => now(),
                ]);

                foreach ($famData['modelos'] as $m) {
                    DB::table('modelos')->insert([
                        'familia_id' => $famId,
                        'marca_id' => $marcaId,
                        'categoria_id' => $famData['categoria_id'],
                        'nombre_comercial' => $m['nombre'],
                        'codigo_modelo' => $m['codigo'],
                        'estado' => true,
                        'created_at' => now(),
                        'empresa_id' => 1,
                        'sucursal_id' => 1,
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}

