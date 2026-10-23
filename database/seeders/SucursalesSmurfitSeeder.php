<?php

namespace Database\Seeders;

use App\Models\AsistenciaMarcaje;
use App\Models\ConfiguracionAsistencia;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Services\CalculoAsistenciaLftService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SucursalesSmurfitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::beginTransaction();

        try {
            // 1. Asegurar País México y Empresa Smurfit Westrock
            $paisMexico = Pais::where('codigo_iso2', 'MX')->first()
                ?? Pais::create([
                    'nombre' => 'México',
                    'codigo_iso2' => 'MX',
                    'codigo_iso3' => 'MEX',
                    'codigo_telefonico' => '+52',
                    'moneda_principal' => 'MXN',
                    'idioma_principal' => 'es',
                    'continente' => 'América del Norte',
                    'zona_horaria' => 'America/Mexico_City',
                    'formato_fecha' => 'dd/mm/yyyy',
                    'formato_moneda' => '$1,234.56',
                    'impuesto_predeterminado' => 16.00,
                    'separador_miles' => ',',
                    'separador_decimales' => '.',
                    'decimales_moneda' => 2,
                    'activo' => true,
                    'latitud' => 19.4326,
                    'longitud' => -99.1332,
                ]);

            $empresa = Empresa::updateOrCreate(
                ['id' => 1],
                [
                    'razon_social' => 'Smurfit Westrock',
                    'nombre_comercial' => 'Smurfit Westrock México',
                    'documento' => 'SWE-850101-ABC',
                    'pais_id' => $paisMexico->id,
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Blvd. Manuel Ávila Camacho 36, Piso 21, Lomas de Chapultepec, CDMX',
                    'telefono' => '+52 55 5282 7000',
                    'email' => 'contacto.mexico@smurfitwestrock.com',
                    'status' => true,
                ]
            );

            // 2. Definición de Plantas / Sucursales Oficiales de Smurfit Westrock en México
            // Cubriendo las diferentes zonas horarias del país (Centro, Noroeste, Norte Frontera, Sonora y Sureste)
            $plantasData = [
                [
                    'id' => 1,
                    'nombre' => 'Planta Cerro Gordo (LSKM)',
                    'codigo_numeral' => '01',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Hidalgo 91, Santa Clara, C.P. 55540, Ecatepec, Edo. Méx.',
                    'latitud' => 19.53120000,
                    'longitud' => -99.03450000,
                    'telefono' => '+52 55 5699 1200',
                ],
                [
                    'id' => 2,
                    'nombre' => 'Planta Tijuana (LSKNA)',
                    'codigo_numeral' => '02',
                    'zona_horaria' => 'America/Tijuana', // Noroeste: UTC-8 invierno / UTC-7 verano
                    'direccion' => 'Blvd. Bellas Artes 20377, Ciudad Industrial, C.P. 22444, Tijuana, B.C.',
                    'latitud' => 32.54110000,
                    'longitud' => -116.92420000,
                    'telefono' => '+52 664 647 3100',
                ],
                [
                    'id' => 3,
                    'nombre' => 'Planta Mexicali (LSKNA)',
                    'codigo_numeral' => '03',
                    'zona_horaria' => 'America/Tijuana', // Noroeste: UTC-8 / UTC-7
                    'direccion' => 'Cerrada Centinela 1799, Parque Industrial Cachanilla, C.P. 21600, Mexicali, B.C.',
                    'latitud' => 32.61050000,
                    'longitud' => -115.44180000,
                    'telefono' => '+52 686 561 2400',
                ],
                [
                    'id' => 4,
                    'nombre' => 'Planta Ciudad Juárez (LSKNA)',
                    'codigo_numeral' => '04',
                    'zona_horaria' => 'America/Ciudad_Juarez', // Frontera Norte: UTC-7 / UTC-6
                    'direccion' => 'Carretera Panamericana 9031 B, Parque Industrial Aeropuerto, C.P. 32685, Cd. Juárez, Chih.',
                    'latitud' => 31.63220000,
                    'longitud' => -106.41870000,
                    'telefono' => '+52 656 629 8000',
                ],
                [
                    'id' => 5,
                    'nombre' => 'Planta Nogales (LSKNA)',
                    'codigo_numeral' => '05',
                    'zona_horaria' => 'America/Hermosillo', // Sonora: UTC-7 todo el año (sin cambio de horario)
                    'direccion' => 'Luis Donaldo Colosio Murrieta 1850, Encinos, C.P. 84064, Nogales, Son.',
                    'latitud' => 31.29820000,
                    'longitud' => -110.95210000,
                    'telefono' => '+52 631 311 4500',
                ],
                [
                    'id' => 6,
                    'nombre' => 'Planta Culiacán (LSKM)',
                    'codigo_numeral' => '06',
                    'zona_horaria' => 'America/Mazatlan', // Pacífico: UTC-7
                    'direccion' => 'Km. 9.9 Carretera Culiacán-El Dorado, C.P. 80000, Culiacán, Sin.',
                    'latitud' => 24.73140000,
                    'longitud' => -107.41210000,
                    'telefono' => '+52 667 760 1100',
                ],
                [
                    'id' => 7,
                    'nombre' => 'Planta Guadalajara (LSKM)',
                    'codigo_numeral' => '07',
                    'zona_horaria' => 'America/Mexico_City', // Centro: UTC-6
                    'direccion' => 'Km. 1.2 Carretera Tala a San Isidro Mazatepec, Tala, Jal., C.P. 45340',
                    'latitud' => 20.62880000,
                    'longitud' => -103.68920000,
                    'telefono' => '+52 384 738 2000',
                ],
                [
                    'id' => 8,
                    'nombre' => 'Planta Monterrey (LSKM)',
                    'codigo_numeral' => '08',
                    'zona_horaria' => 'America/Monterrey', // Noreste: UTC-6
                    'direccion' => 'Nefertem 1301, Las Escobas, C.P. 67133, Guadalupe, N.L.',
                    'latitud' => 25.68660000,
                    'longitud' => -100.21850000,
                    'telefono' => '+52 81 8144 5000',
                ],
                [
                    'id' => 9,
                    'nombre' => 'Planta San Luis Potosí (LWRK)',
                    'codigo_numeral' => '09',
                    'zona_horaria' => 'America/Mexico_City', // Bajío / Centro: UTC-6
                    'direccion' => 'Av. Promoción 310, Zona Industrial 1ra Sección, C.P. 78395, San Luis Potosí, S.L.P.',
                    'latitud' => 22.11890000,
                    'longitud' => -100.93240000,
                    'telefono' => '+52 444 824 5000',
                ],
                [
                    'id' => 10,
                    'nombre' => 'Sucursal Cancún (LSKM)',
                    'codigo_numeral' => '10',
                    'zona_horaria' => 'America/Cancun', // Sureste: UTC-5 todo el año
                    'direccion' => 'Calle Chalchoapa 23, Zona Industrial Benito Juárez, C.P. 77530, Cancún, Q.R.',
                    'latitud' => 21.13980000,
                    'longitud' => -86.87150000,
                    'telefono' => '+52 998 881 7000',
                ],
            ];

            $sucursalesModelos = [];
            foreach ($plantasData as $p) {
                $sucursal = Sucursal::updateOrCreate(
                    ['id' => $p['id']],
                    [
                        'empresa_id' => $empresa->id,
                        'nombre' => $p['nombre'],
                        'codigo_numeral' => $p['codigo_numeral'],
                        'zona_horaria' => $p['zona_horaria'],
                        'direccion' => $p['direccion'],
                        'latitud' => $p['latitud'],
                        'longitud' => $p['longitud'],
                        'telefono' => $p['telefono'],
                        'pais_telefono_id' => $paisMexico->id,
                        'status' => true,
                    ]
                );
                $sucursalesModelos[$p['id']] = $sucursal;

                // 3. Crear Turno Laboral estándar para cada sucursal
                TurnoLaboral::updateOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'sucursal_id' => $sucursal->id,
                        'nombre' => 'Turno Matutino ' . $sucursal->codigo_numeral,
                    ],
                    [
                        'tipo_jornada' => 'diurna',
                        'hora_entrada' => '07:00:00',
                        'hora_salida' => '15:00:00',
                        'horas_diarias_ley' => 8.00,
                        'minutos_descanso' => 60,
                        'descanso_pagado' => true,
                        'dias_laborables' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                        'status' => true,
                    ]
                );
            }

            // 4. Distribuir Colaboradores Existentes entre las distintas Sucursales
            $empleados = Empleado::where('empresa_id', $empresa->id)->orderBy('id')->get();
            $numSucursales = count($plantasData);
            $sucursalIds = array_keys($sucursalesModelos);

            $this->command?->info("Vinculando {$empleados->count()} colaboradores entre las 10 plantas de Smurfit Westrock...");

            foreach ($empleados as $index => $empleado) {
                $targetSucursalId = $sucursalIds[$index % $numSucursales];
                $targetSucursal = $sucursalesModelos[$targetSucursalId];

                // Turno matutino de la sucursal asignada
                $turno = TurnoLaboral::where('sucursal_id', $targetSucursal->id)->first();

                $empleado->update([
                    'sucursal_id' => $targetSucursal->id,
                    'turno_laboral_id' => $turno?->id,
                ]);
            }

            // 5. Generar marcajes de prueba representativos para hoy para validar las Zonas Horarias
            // Fecha de simulación: hoy
            $hoy = Carbon::today();
            $calculoService = app(CalculoAsistenciaLftService::class);

            // Seleccionar 1 colaborador representativo de cada planta clave para generar sus marcajes
            // Mostrando las diferencias de huso horario
            $casosPrueba = [
                1 => ['minutos_entrada' => 3, 'comentario' => 'Cerro Gordo - Hora Centro (07:03 CDMX - Puntual)'],
                2 => ['minutos_entrada' => 1, 'comentario' => 'Tijuana - Hora Noroeste (07:01 Tijuana - Puntual)'],
                3 => ['minutos_entrada' => 5, 'comentario' => 'Mexicali - Hora Noroeste (07:05 Mexicali - Puntual)'],
                4 => ['minutos_entrada' => 18, 'comentario' => 'Cd. Juárez - Hora Frontera (07:18 Juárez - Retardo con tolerancia de 10m)'],
                5 => ['minutos_entrada' => 0, 'comentario' => 'Nogales - Hora Sonora (07:00 Hermosillo - Puntual Exacto)'],
                6 => ['minutos_entrada' => 4, 'comentario' => 'Culiacán - Hora Pacífico (07:04 Mazatlán - Puntual)'],
                7 => ['minutos_entrada' => 2, 'comentario' => 'Guadalajara - Hora Centro (07:02 GDL - Puntual)'],
                8 => ['minutos_entrada' => 6, 'comentario' => 'Monterrey - Hora Noreste (07:06 MTY - Puntual)'],
                9 => ['minutos_entrada' => 8, 'comentario' => 'San Luis Potosí - Hora Centro (07:08 SLP - Puntual)'],
                10 => ['minutos_entrada' => 2, 'comentario' => 'Cancún - Hora Sureste (07:02 Cancún - Puntual)'],
            ];

            foreach ($casosPrueba as $sucursalId => $infoCaso) {
                $empleadoPlanta = Empleado::where('empresa_id', $empresa->id)
                    ->where('sucursal_id', $sucursalId)
                    ->first();

                if (! $empleadoPlanta) {
                    continue;
                }

                $sucursal = $sucursalesModelos[$sucursalId];
                $tz = $sucursal->zona_horaria ?: 'America/Mexico_City';

                // Hora local en la planta: 07:00 + minutos de entrada
                $horaLocalStr = sprintf('07:%02d:00', $infoCaso['minutos_entrada']);
                $horaLocal = Carbon::parse($hoy->toDateString() . ' ' . $horaLocalStr, $tz);

                // Limpiar marcajes previos del día para evitar duplicados en pruebas
                AsistenciaMarcaje::where('empleado_id', $empleadoPlanta->id)
                    ->whereDate('fecha_hora', $hoy->toDateString())
                    ->delete();

                // Registrar entrada
                $marcajeEntrada = AsistenciaMarcaje::create([
                    'empresa_id' => $empresa->id,
                    'sucursal_id' => $sucursal->id,
                    'empleado_id' => $empleadoPlanta->id,
                    'tipo_marcaje' => 'entrada',
                    'fecha_hora' => $horaLocal->format('Y-m-d H:i:s'),
                    'origen' => 'kiosko',
                    'observaciones' => $infoCaso['comentario'],
                    'tipo_entrada' => 'normal',
                ]);

                // Recalcular asistencia diaria LFT
                $calculoService->calcularHorasDiarias($empleadoPlanta, $hoy->toDateString());
            }

            DB::commit();

            $this->command?->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->command?->info('✅ SEEDER DE SUCURSALES SMURFIT WESTROCK EJECUTADO CON ÉXITO');
            $this->command?->info("🏢 Empresa: {$empresa->razon_social} (Zona Horaria Default: {$empresa->zona_horaria})");
            $this->command?->info('🏭 Plantas creadas con sus zonas horarias:');
            foreach ($plantasData as $p) {
                $this->command?->info("   [{$p['codigo_numeral']}] {$p['nombre']} → {$p['zona_horaria']}");
            }
            $this->command?->info("👥 {$empleados->count()} colaboradores distribuidos entre las plantas.");
            $this->command?->info('⏱️ Marcajes demostrativos generados para hoy con cálculos LFT locales.');
            $this->command?->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command?->error("❌ Error en SucursalesSmurfitSeeder: {$e->getMessage()}");
            throw $e;
        }
    }
}

