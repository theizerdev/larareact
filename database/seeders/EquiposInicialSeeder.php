<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

        // 3. Familias y Modelos

        // --- APPLE ---
        // Familia iPhone 13
        $famIphone13 = DB::table('familias')->insertGetId([
            'marca_id' => $marcaIds['Apple'],
            'categoria_id' => $catSmartphoneId,
            'nombre' => 'iPhone Serie 13',
            'descripcion' => 'Serie de iPhones lanzados en 2021',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);
        $modelosApple13 = [
            ['nombre' => 'iPhone 13 Mini', 'codigo' => 'A2481 / A2631'],
            ['nombre' => 'iPhone 13', 'codigo' => 'A2482 / A2633'],
            ['nombre' => 'iPhone 13 Pro', 'codigo' => 'A2483 / A2636'],
            ['nombre' => 'iPhone 13 Pro Max', 'codigo' => 'A2484 / A2638'],
        ];
        foreach ($modelosApple13 as $m) {
            DB::table('modelos')->insert([
                'familia_id' => $famIphone13,
                'marca_id' => $marcaIds['Apple'],
                'categoria_id' => $catSmartphoneId,
                'nombre_comercial' => $m['nombre'],
                'codigo_modelo' => $m['codigo'],
                'estado' => true,
                'created_at' => now(),
                'empresa_id' => 1,
                'sucursal_id' => 1,
                'updated_at' => now(),
            ]);
        }

        // Familia iPad Standard
        $famIpad = DB::table('familias')->insertGetId([
            'marca_id' => $marcaIds['Apple'],
            'categoria_id' => $catTabletId,
            'nombre' => 'iPad Standard',
            'descripcion' => 'Línea de tablets básicas de Apple',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);
        $modelosIpad = [
            ['nombre' => 'iPad 9na Gen (10.2")', 'codigo' => 'A2602 / A2604'],
            ['nombre' => 'iPad 10ma Gen (10.9")', 'codigo' => 'A2696 / A2757'],
        ];
        foreach ($modelosIpad as $m) {
            DB::table('modelos')->insert([
                'familia_id' => $famIpad,
                'marca_id' => $marcaIds['Apple'],
                'categoria_id' => $catTabletId,
                'nombre_comercial' => $m['nombre'],
                'codigo_modelo' => $m['codigo'],
                'estado' => true,
                'created_at' => now(),
                'empresa_id' => 1,
                'sucursal_id' => 1,
                'updated_at' => now(),
            ]);
        }

        // --- SAMSUNG ---
        // Familia Galaxy Serie A
        $famGalaxyA = DB::table('familias')->insertGetId([
            'marca_id' => $marcaIds['Samsung'],
            'categoria_id' => $catSmartphoneId,
            'nombre' => 'Galaxy Serie A',
            'descripcion' => 'Línea gama media y entrada de Samsung',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);
        $modelosGalaxyA = [
            ['nombre' => 'Galaxy A12', 'codigo' => 'SM-A125F'],
            ['nombre' => 'Galaxy A14 4G', 'codigo' => 'SM-A145F'],
            ['nombre' => 'Galaxy A14 5G', 'codigo' => 'SM-A146B'],
            ['nombre' => 'Galaxy A54 5G', 'codigo' => 'SM-A546B'],
            ['nombre' => 'Galaxy A55 5G', 'codigo' => 'SM-A556B'],
        ];
        foreach ($modelosGalaxyA as $m) {
            DB::table('modelos')->insert([
                'familia_id' => $famGalaxyA,
                'marca_id' => $marcaIds['Samsung'],
                'categoria_id' => $catSmartphoneId,
                'nombre_comercial' => $m['nombre'],
                'codigo_modelo' => $m['codigo'],
                'estado' => true,
                'created_at' => now(),
                'empresa_id' => 1,
                'sucursal_id' => 1,
                'updated_at' => now(),
            ]);
        }

        // Familia Galaxy Tab A
        $famGalaxyTabA = DB::table('familias')->insertGetId([
            'marca_id' => $marcaIds['Samsung'],
            'categoria_id' => $catTabletId,
            'nombre' => 'Galaxy Tab Serie A',
            'descripcion' => 'Tablets gama media de Samsung',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);
        $modelosGalaxyTab = [
            ['nombre' => 'Galaxy Tab A7 Lite 8.7"', 'codigo' => 'SM-T220 / SM-T225'],
            ['nombre' => 'Galaxy Tab A8 10.5"', 'codigo' => 'SM-X200 / SM-X205'],
            ['nombre' => 'Galaxy Tab A9+ 11"', 'codigo' => 'SM-X210 / SM-X216'],
        ];
        foreach ($modelosGalaxyTab as $m) {
            DB::table('modelos')->insert([
                'familia_id' => $famGalaxyTabA,
                'marca_id' => $marcaIds['Samsung'],
                'categoria_id' => $catTabletId,
                'nombre_comercial' => $m['nombre'],
                'codigo_modelo' => $m['codigo'],
                'estado' => true,
                'created_at' => now(),
                'empresa_id' => 1,
                'sucursal_id' => 1,
                'updated_at' => now(),
            ]);
        }

        // --- XIAOMI ---
        // Familia Redmi Note 12
        $famRedmiNote12 = DB::table('familias')->insertGetId([
            'marca_id' => $marcaIds['Xiaomi'],
            'categoria_id' => $catSmartphoneId,
            'nombre' => 'Redmi Note 12 Series',
            'descripcion' => 'Serie Redmi Note generación 12',
            'estado' => true,
            'created_at' => now(),
            'empresa_id' => 1,
            'sucursal_id' => 1,
            'updated_at' => now(),
        ]);
        $modelosXiaomi = [
            ['nombre' => 'Redmi Note 12 4G', 'codigo' => '23021RAAEG'],
            ['nombre' => 'Redmi Note 12 Pro 5G', 'codigo' => '22101316G'],
        ];
        foreach ($modelosXiaomi as $m) {
            DB::table('modelos')->insert([
                'familia_id' => $famRedmiNote12,
                'marca_id' => $marcaIds['Xiaomi'],
                'categoria_id' => $catSmartphoneId,
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
