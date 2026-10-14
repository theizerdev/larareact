<?php

namespace Database\Seeders;

use App\Models\Empresa;
use App\Models\OpcionComida;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ComedorMexicoSeeder extends Seeder
{
    /**
     * Catálogo completo de alimentos y menús industriales para México
     * con horarios estipulados por tiempo de comida y costos en Pesos Mexicanos (MXN).
     */
    public function run(): void
    {
        $empresas = Empresa::all();

        if ($empresas->isEmpty()) {
            $this->command?->warn('No se encontraron empresas registradas para asociar los alimentos.');
            return;
        }

        $alimentosMexico = [
            // ─── 1. DESAYUNOS (06:30 - 11:00) ───────────────────────────────────
            [
                'nombre' => 'Chilaquiles con Huevos al Gusto',
                'tipo' => OpcionComida::TIPO_DESAYUNO,
                'descripcion' => 'Chilaquiles verdes o rojos con crema fresca, queso cotija, 2 huevos al gusto, frijoles refritos y café de olla con canela.',
                'costo_empleado' => 35.00,
                'costo_empresa' => 75.00,
                'hora_inicio' => '06:30:00',
                'hora_fin' => '11:00:00',
                'icono' => 'coffee',
                'color' => 'amber',
                'orden' => 1,
            ],
            [
                'nombre' => 'Huevos a la Mexicana con Frijoles',
                'tipo' => OpcionComida::TIPO_DESAYUNO,
                'descripcion' => 'Huevos revueltos con jitomate, cebolla y chile serrano, frijolitos bayos refritos, tortillas de maíz calientes y café con leche.',
                'costo_empleado' => 30.00,
                'costo_empresa' => 65.00,
                'hora_inicio' => '06:30:00',
                'hora_fin' => '11:00:00',
                'icono' => 'coffee',
                'color' => 'amber',
                'orden' => 2,
            ],
            [
                'nombre' => 'Desayuno Ligero: Fruta, Granola y Yogur',
                'tipo' => OpcionComida::TIPO_DESAYUNO,
                'descripcion' => 'Tazón de papaya, melón y manzana picada con miel de abeja pura, granola artesanal, yogur natural y té de manzanilla o jugo verde.',
                'costo_empleado' => 25.00,
                'costo_empresa' => 50.00,
                'hora_inicio' => '06:30:00',
                'hora_fin' => '11:30:00',
                'icono' => 'apple',
                'color' => 'emerald',
                'orden' => 3,
            ],

            // ─── 2. ALMUERZOS / COMIDAS (12:00 - 17:00) ─────────────────────────
            [
                'nombre' => 'Comida Corrida Mexicana Completa',
                'tipo' => OpcionComida::TIPO_ALMUERZO,
                'descripcion' => 'Sopa de fideo casera o consomé con verduras, arroz rojo, guisado del día (Bistec en salsa pasilla o Milanesa de pollo), frijoles de la olla, tortillas y agua fresca de jamaica.',
                'costo_empleado' => 45.00,
                'costo_empresa' => 95.00,
                'hora_inicio' => '12:00:00',
                'hora_fin' => '17:00:00',
                'icono' => 'utensils',
                'color' => 'emerald',
                'orden' => 4,
            ],
            [
                'nombre' => 'Pechuga Asada con Ensalada y Nopales',
                'tipo' => OpcionComida::TIPO_ALMUERZO,
                'descripcion' => 'Pechuga de pollo a las brasas, ensalada fresca de nopales asados con queso panela, aguacate, arroz integral y agua de limón con chía.',
                'costo_empleado' => 45.00,
                'costo_empresa' => 95.00,
                'hora_inicio' => '12:00:00',
                'hora_fin' => '17:00:00',
                'icono' => 'utensils',
                'color' => 'emerald',
                'orden' => 5,
            ],
            [
                'nombre' => 'Mole Poblano con Pollo y Arroz Rojo',
                'tipo' => OpcionComida::TIPO_ALMUERZO,
                'descripcion' => 'Tradicional mole poblano dulce y especiado con pieza de pollo, ajonjolí tostado, arroz a la mexicana, frijoles refritos y agua fresca de horchata.',
                'costo_empleado' => 50.00,
                'costo_empresa' => 105.00,
                'hora_inicio' => '12:00:00',
                'hora_fin' => '17:00:00',
                'icono' => 'utensils',
                'color' => 'orange',
                'orden' => 6,
            ],

            // ─── 3. CENAS (18:30 - 01:00) ───────────────────────────────────────
            [
                'nombre' => 'Tacos de Guisado al Vapor (3 pzas)',
                'tipo' => OpcionComida::TIPO_CENA,
                'descripcion' => '3 tacos de tortilla doble con guisados tradicionales (tinga de pollo, chicharrón prensado o picadillo casero), frijolitos, salsas y café de olla caliente.',
                'costo_empleado' => 35.00,
                'costo_empresa' => 75.00,
                'hora_inicio' => '18:30:00',
                'hora_fin' => '23:30:00',
                'icono' => 'moon',
                'color' => 'blue',
                'orden' => 7,
            ],
            [
                'nombre' => 'Sincronizadas con Jamón y Queso Oaxaca',
                'tipo' => OpcionComida::TIPO_CENA,
                'descripcion' => 'Tortillas de harina norteñas con jamón de pavo, queso Oaxaca fundido, pico de gallo fresco, frijoles refritos y té caliente.',
                'costo_empleado' => 30.00,
                'costo_empresa' => 65.00,
                'hora_inicio' => '19:00:00',
                'hora_fin' => '01:00:00',
                'icono' => 'moon',
                'color' => 'blue',
                'orden' => 8,
            ],

            // ─── 4. REFRIGERIOS / SNACKS (08:00 - 20:00) ────────────────────────
            [
                'nombre' => 'Torta de Jamón con Queso Panela',
                'tipo' => OpcionComida::TIPO_REFRIGERIO,
                'descripcion' => 'Telera tradicional con frijoles untados, jamón de pierna, queso panela, aguacate, jitomate, chiles jalapeños y jugo embotellado o agua.',
                'costo_empleado' => 25.00,
                'costo_empresa' => 50.00,
                'hora_inicio' => '10:00:00',
                'hora_fin' => '19:00:00',
                'icono' => 'sandwich',
                'color' => 'purple',
                'orden' => 9,
            ],
            [
                'nombre' => 'Box Lunch Energético: Fruta y Amaranto',
                'tipo' => OpcionComida::TIPO_REFRIGERIO,
                'descripcion' => 'Manzana o plátano fresco, mix de nueces y cacahuates tostados, barra de amaranto con miel y botella de agua purificada 600ml.',
                'costo_empleado' => 15.00,
                'costo_empresa' => 35.00,
                'hora_inicio' => '07:00:00',
                'hora_fin' => '21:00:00',
                'icono' => 'apple',
                'color' => 'purple',
                'orden' => 10,
            ],
        ];

        foreach ($empresas as $empresa) {
            // Eliminar opciones genéricas anteriores o desactualizadas para inicializar el catálogo mexicano
            OpcionComida::where('empresa_id', $empresa->id)->forceDelete();

            foreach ($alimentosMexico as $item) {
                OpcionComida::create([
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => null,
                    'nombre' => $item['nombre'],
                    'tipo' => $item['tipo'],
                    'descripcion' => $item['descripcion'],
                    'costo_empleado' => $item['costo_empleado'],
                    'costo_empresa' => $item['costo_empresa'],
                    'hora_inicio' => $item['hora_inicio'],
                    'hora_fin' => $item['hora_fin'],
                    'dias_disponibles' => ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'],
                    'icono' => $item['icono'],
                    'color' => $item['color'],
                    'orden' => $item['orden'],
                    'status' => true,
                ]);
            }
        }
    }
}
