<?php

namespace Database\Seeders;

use App\Models\Categoria;
use App\Models\Empresa;
use App\Models\Servicio;
use App\Models\Sucursal;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ServiciosReparacionSeeder extends Seeder
{
    public function run(): void
    {
        $serviciosPorCategoria = [
            'Smartphone' => [
                [
                    'codigo' => 'SERV-SMART-001',
                    'nombre' => 'Cambio de Pantalla / Display (Touch + LCD/OLED)',
                    'descripcion' => 'Reemplazo completo de módulo de pantalla destruido, con falla táctil o sin imagen.',
                    'precio' => 45.00,
                ],
                [
                    'codigo' => 'SERV-SMART-002',
                    'nombre' => 'Cambio de Batería Original / Calidad A+',
                    'descripcion' => 'Sustitución de batería agotada, hinchada o con degradación de carga.',
                    'precio' => 25.00,
                ],
                [
                    'codigo' => 'SERV-SMART-003',
                    'nombre' => 'Reparación / Reemplazo de Puerto de Carga (Pin de Carga)',
                    'descripcion' => 'Reparación o cambio del puerto Tipo-C, MicroUSB o Lightning por falso contacto o daño.',
                    'precio' => 20.00,
                ],
                [
                    'codigo' => 'SERV-SMART-004',
                    'nombre' => 'Mantenimiento y Dessulfatado por Humedad / Agua',
                    'descripcion' => 'Lavado ultrasónico de placa madre, secado y eliminación de sulfato por contacto con líquidos.',
                    'precio' => 30.00,
                ],
                [
                    'codigo' => 'SERV-SMART-005',
                    'nombre' => 'Cambio de Tapa Trasera / Cristal Trasero',
                    'descripcion' => 'Reemplazo del cristal o carcasa posterior dañada por impacto.',
                    'precio' => 25.00,
                ],
                [
                    'codigo' => 'SERV-SMART-006',
                    'nombre' => 'Reparación de Micrófono / Auricular / Altavoz',
                    'descripcion' => 'Solución a problemas de audio en llamadas o reproducción de sonido distorsionado/nulo.',
                    'precio' => 18.00,
                ],
                [
                    'codigo' => 'SERV-SMART-007',
                    'nombre' => 'Reemplazo de Módulo de Cámara (Trasera / Frontal)',
                    'descripcion' => 'Sustitución de lentes con mancha, desenfoque o sin señal de video.',
                    'precio' => 28.00,
                ],
                [
                    'codigo' => 'SERV-SMART-008',
                    'nombre' => 'Diagnóstico Avanzado y Reparación de Placa (Micro-soldadura)',
                    'descripcion' => 'Detección y reparación de cortos en tarjeta madre, fallo de IC de carga o imagen.',
                    'precio' => 50.00,
                ],
            ],
            'Tablet' => [
                [
                    'codigo' => 'SERV-TAB-001',
                    'nombre' => 'Cambio de Cristal Táctil / Display Tablet',
                    'descripcion' => 'Sustitución de pantalla rota o cristal táctil inoperativo en tablets.',
                    'precio' => 50.00,
                ],
                [
                    'codigo' => 'SERV-TAB-002',
                    'nombre' => 'Cambio de Batería de Alta Capacidad Tablet',
                    'descripcion' => 'Instalación de celda nueva para tablets que no encienden o se apagan rápido.',
                    'precio' => 35.00,
                ],
                [
                    'codigo' => 'SERV-TAB-003',
                    'nombre' => 'Reparación de Centro de Carga Tablet',
                    'descripcion' => 'Reemplazo o resoldado del conector de carga.',
                    'precio' => 25.00,
                ],
                [
                    'codigo' => 'SERV-TAB-004',
                    'nombre' => 'Reinstalación de Firmware / Sistema Operativo Tablet',
                    'descripcion' => 'Restauración de software desactualizado, bloqueado o con bucle de reinicio.',
                    'precio' => 20.00,
                ],
            ],
            'Laptop' => [
                [
                    'codigo' => 'SERV-LAP-001',
                    'nombre' => 'Mantenimiento Térmico Preventivo (Limpieza + Pasta Térmica)',
                    'descripcion' => 'Limpieza interna de ventiladores, disipador y sustitución de pasta térmica de alto rendimiento.',
                    'precio' => 25.00,
                ],
                [
                    'codigo' => 'SERV-LAP-002',
                    'nombre' => 'Cambio de Pantalla LED / OLED para Laptop',
                    'descripcion' => 'Reemplazo de pantalla quebrada, con rayas o sin retroiluminación.',
                    'precio' => 65.00,
                ],
                [
                    'codigo' => 'SERV-LAP-003',
                    'nombre' => 'Reemplazo de Teclado Laptop',
                    'descripcion' => 'Instalación de teclado nuevo en caso de teclas pegadas o inoperativas.',
                    'precio' => 30.00,
                ],
                [
                    'codigo' => 'SERV-LAP-004',
                    'nombre' => 'Instalación y Configuración de Disco SSD + Sistema Operativo',
                    'descripcion' => 'Formateo, instalación limpia de SO, drivers y migración de datos.',
                    'precio' => 35.00,
                ],
                [
                    'codigo' => 'SERV-LAP-005',
                    'nombre' => 'Reparación de Bisagras y Carcasa Laptop',
                    'descripcion' => 'Reconstrucción o reemplazo de soportes plásticos y bisagras mecánicas.',
                    'precio' => 40.00,
                ],
                [
                    'codigo' => 'SERV-LAP-006',
                    'nombre' => 'Reparación de Jack de Alimentación DC Power',
                    'descripcion' => 'Reparación o cambio del conector de carga interno de la tarjeta madre.',
                    'precio' => 30.00,
                ],
            ],
            'Smartwatch' => [
                [
                    'codigo' => 'SERV-WATCH-001',
                    'nombre' => 'Cambio de Pantalla / Cristal AMOLED Smartwatch',
                    'descripcion' => 'Reemplazo de pantalla táctil para relojes inteligentes.',
                    'precio' => 35.00,
                ],
                [
                    'codigo' => 'SERV-WATCH-002',
                    'nombre' => 'Cambio de Batería Smartwatch',
                    'descripcion' => 'Instalación de batería nueva manteniendo el sello contra polvo.',
                    'precio' => 22.00,
                ],
                [
                    'codigo' => 'SERV-WATCH-003',
                    'nombre' => 'Mantenimiento de Sensor de Carga y Cristal Trasero',
                    'descripcion' => 'Limpieza, pulido o cambio del cristal de sensores biométricos.',
                    'precio' => 20.00,
                ],
            ],
            'Consola de Videojuegos' => [
                [
                    'codigo' => 'SERV-CONS-001',
                    'nombre' => 'Mantenimiento Profundo Consola + Metal Líquido / Pasta Térmica',
                    'descripcion' => 'Limpieza completa de ventilador, radiador y cambio de disipación térmica para PS4, PS5, Xbox.',
                    'precio' => 35.00,
                ],
                [
                    'codigo' => 'SERV-CONS-002',
                    'nombre' => 'Reparación / Reemplazo de Puerto HDMI Consola',
                    'descripcion' => 'Sustitución de puerto HDMI dañado que provoca pantalla negra o sin señal.',
                    'precio' => 45.00,
                ],
                [
                    'codigo' => 'SERV-CONS-003',
                    'nombre' => 'Reparación de Drifting en Análogos de Mando (Joy-Con / DualSense)',
                    'descripcion' => 'Cambio de potenciómetros o joysticks con sensor Hall anti-drift.',
                    'precio' => 15.00,
                ],
                [
                    'codigo' => 'SERV-CONS-004',
                    'nombre' => 'Reparación de Fuente de Poder Interna Consola',
                    'descripcion' => 'Diagnóstico y cambio de componentes defectuosos en la fuente de alimentación.',
                    'precio' => 40.00,
                ],
            ],
        ];

        $empresas = Empresa::all();
        if ($empresas->isEmpty()) {
            return;
        }

        foreach ($empresas as $empresa) {
            $sucursal = Sucursal::where('empresa_id', $empresa->id)->first();
            $sucursalId = $sucursal ? $sucursal->id : 1;

            foreach ($serviciosPorCategoria as $categoriaNombre => $servicios) {
                // Buscar o crear la categoría correspondiente en la base de datos sin restricciones de tenant scope
                $categoria = Categoria::withoutGlobalScope('multitenancy')->firstOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'nombre' => $categoriaNombre,
                    ],
                    [
                        'sucursal_id' => $sucursalId,
                        'slug' => Str::slug($categoriaNombre),
                        'estado' => true,
                    ]
                );

                foreach ($servicios as $data) {
                    Servicio::withoutGlobalScope('multitenancy')->updateOrCreate(
                        [
                            'empresa_id' => $empresa->id,
                            'codigo' => $data['codigo'],
                        ],
                        [
                            'sucursal_id' => $sucursalId,
                            'categoria_id' => $categoria->id,
                            'nombre' => $data['nombre'],
                            'descripcion' => $data['descripcion'],
                            'precio' => $data['precio'],
                            'estado' => true,
                        ]
                    );
                }
            }
        }
    }
}
