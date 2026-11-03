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
     * Creado a partir de las 68 Plantas / Localidades oficiales del archivo maestro:
     * "Archivo maestro de Equipos & Ubicaciones.xlsx" (Pestaña Detail2)
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

            // 2. Definición de las 68 Plantas / Sucursales Oficiales de Smurfit Westrock en México
            // Obtenidas directamente de la pestaña 'Detail2' (Columna 'Planta / Localidad')
            $plantasData = [
                [
                    'id' => 1,
                    'nombre' => 'BAG IN BOX TIJUANA',
                    'codigo_numeral' => '01',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Exportadores 19231, col ciudad industrial, cp 22444, tijuana baja california.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3101',
                ],
                [
                    'id' => 2,
                    'nombre' => 'BODEGA ATLACOMULCO (Displays) (LSKM)',
                    'codigo_numeral' => '02',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Gumercindo Gutierrez Lote 3 Mz 22, Parque Industrial, CP 50450 Atlacomulco',
                    'latitud' => 19.79690000,
                    'longitud' => -99.87420000,
                    'telefono' => '+52 55 5699 1202',
                ],
                [
                    'id' => 3,
                    'nombre' => 'BODEGA ATLACOMULCO (LSKM)',
                    'codigo_numeral' => '03',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Blvd. Salvador Sánchez Colin 1011, Mza. 24A Parque Industrial, Atlacomulco, Edo. Méx.',
                    'latitud' => 19.79690000,
                    'longitud' => -99.87420000,
                    'telefono' => '+52 55 5699 1203',
                ],
                [
                    'id' => 4,
                    'nombre' => 'BODEGA CANCÚN (LSKM)',
                    'codigo_numeral' => '04',
                    'zona_horaria' => 'America/Cancun',
                    'direccion' => 'Calle Chalchoapa 23, Manzana Cinco, Zona Industrial Municipio de Benito Juárez (Cancún) Quintana Roo CP 77530',
                    'latitud' => 21.16190000,
                    'longitud' => -86.85150000,
                    'telefono' => '+52 998 881 7004',
                ],
                [
                    'id' => 5,
                    'nombre' => 'BODEGA CELAYA (LSKM)',
                    'codigo_numeral' => '05',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Carr. Alterna Celaya - Villagran km 4.2 Fracc. El Puente Celaya Gto C.P. 38110',
                    'latitud' => 20.52220000,
                    'longitud' => -100.81220000,
                    'telefono' => '+52 461 618 3005',
                ],
                [
                    'id' => 6,
                    'nombre' => 'BODEGA FIBRAS MONTERREY /APODACA',
                    'codigo_numeral' => '06',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'MX APODACA LOTE-17 MANZANA #151 CARRETERA STA ROSA PARQUE-IND. MILIMEX SANTA ROSA',
                    'latitud' => 25.78140000,
                    'longitud' => -100.18860000,
                    'telefono' => '+52 81 8144 5006',
                ],
                [
                    'id' => 7,
                    'nombre' => 'BODEGA GUADALAJARA TALA (LSKM)',
                    'codigo_numeral' => '07',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'KM 2 Carretera San Isidro Mazatepec Tala, San Isidro Mazatepec, Jalisco, CP 45340',
                    'latitud' => 20.65580000,
                    'longitud' => -103.70250000,
                    'telefono' => '+52 33 3847 2007',
                ],
                [
                    'id' => 8,
                    'nombre' => 'BODEGA GUADALUPE (LSKM)',
                    'codigo_numeral' => '08',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Av. del Mar, Bodega 4, 5 Y 6, Colonia Viga, Guadalupe, Nuevo Leon, C.P. 67116',
                    'latitud' => 25.67680000,
                    'longitud' => -100.25650000,
                    'telefono' => '+52 81 8144 5008',
                ],
                [
                    'id' => 9,
                    'nombre' => 'BODEGA HERMOSILLO/ SE COMPARTE CON LSKNA NOGALES (5 EMPLEADOS)',
                    'codigo_numeral' => '09',
                    'zona_horaria' => 'America/Hermosillo',
                    'direccion' => 'Boulevard Antonio Quiroga 114-B, Colonia el Llanito, Hermosillo, Sonora, C.P. 83220  Logo de CT y banderas',
                    'latitud' => 29.07290000,
                    'longitud' => -110.95590000,
                    'telefono' => '+52 631 311 4509',
                ],
                [
                    'id' => 10,
                    'nombre' => 'BODEGA PUEBLA (LSKM)',
                    'codigo_numeral' => '10',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'CALLE PAPALOAPAN NO. 19 SANCTORUM PUE. CP. 72730. BODEGA 6',
                    'latitud' => 19.04140000,
                    'longitud' => -98.20630000,
                    'telefono' => '+52 222 249 6010',
                ],
                [
                    'id' => 11,
                    'nombre' => 'BODEGA QUERÉTARO (KELLOGG S) (LSKM)',
                    'codigo_numeral' => '11',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Parque Industrial TLC número 19, Ejido Palo Alto, El Marqués, Querétaro, C.P. 76246',
                    'latitud' => 20.65000000,
                    'longitud' => -100.30000000,
                    'telefono' => '+52 442 229 1011',
                ],
                [
                    'id' => 12,
                    'nombre' => 'BODEGA SALTILLO (LSKM)',
                    'codigo_numeral' => '12',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Calle Industria Metalmecanica # 4028 Parque Industrial Ramos Arizpe en Ramos Arizpe Coahuila CP 25900',
                    'latitud' => 25.54220000,
                    'longitud' => -100.95720000,
                    'telefono' => '+52 878 782 5012',
                ],
                [
                    'id' => 13,
                    'nombre' => 'BODEGA SAN LUIS POTOSI (LSKM)',
                    'codigo_numeral' => '13',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Pintores 275 Esq. Eje 134 Zona Ind. El Potosí CP 78309',
                    'latitud' => 22.15650000,
                    'longitud' => -100.98550000,
                    'telefono' => '+52 444 824 5013',
                ],
                [
                    'id' => 14,
                    'nombre' => 'BODEGA VALLEJO (LSKM)',
                    'codigo_numeral' => '14',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Poniente 134 650 Industrial Vallejo Azcapotzalco, 02300 Cuidad de Mexico CDMX',
                    'latitud' => 19.48690000,
                    'longitud' => -99.18590000,
                    'telefono' => '+52 55 5699 1214',
                ],
                [
                    'id' => 15,
                    'nombre' => 'BODEGA VILLAHERMOSA (LSKM)',
                    'codigo_numeral' => '15',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Plomo 26 Bodega 4 Cd. Industrial etapa 1 Villahermosa Tabasco C.P. 86010',
                    'latitud' => 17.98920000,
                    'longitud' => -92.92810000,
                    'telefono' => '+52 993 310 8015',
                ],
                [
                    'id' => 16,
                    'nombre' => 'Bodega la Noria (Fibras)',
                    'codigo_numeral' => '16',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Parcela 138 Z-1 P/2 Del Ejido Gabriel Leyva Santa Catarina. Parque Industrial Queretaro, Av. La Noria 107 Santa Rosa, Jauregui, Queretaro',
                    'latitud' => 20.74110000,
                    'longitud' => -100.44690000,
                    'telefono' => '+52 442 229 1016',
                ],
                [
                    'id' => 17,
                    'nombre' => 'CONSUMER PACKAGING CELAYA (LWRK)',
                    'codigo_numeral' => '17',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Concepción Beistegui KM 2.5, Zona Industrial Poniente, Celaya, Gto. CP 38024.',
                    'latitud' => 20.52220000,
                    'longitud' => -100.81220000,
                    'telefono' => '+52 461 618 3017',
                ],
                [
                    'id' => 18,
                    'nombre' => 'CONSUMER PACKAGING CERRO GORDO (LSKM)',
                    'codigo_numeral' => '18',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Hidalgo 91, Santa Clara, C.P. 55540, Ecatepec, Edo. Méx.',
                    'latitud' => 19.53120000,
                    'longitud' => -99.03450000,
                    'telefono' => '+52 55 5699 1218',
                ],
                [
                    'id' => 19,
                    'nombre' => 'CONSUMER PACKAGING MONTERREY 1 (LSKM)',
                    'codigo_numeral' => '19',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Nefertem 1301, Las Escobas, 67133 Guadalupe, N.L., México.',
                    'latitud' => 25.67680000,
                    'longitud' => -100.25650000,
                    'telefono' => '+52 81 8144 5019',
                ],
                [
                    'id' => 20,
                    'nombre' => 'CONSUMER PACKAGING MONTERREY 2 (LWRK)',
                    'codigo_numeral' => '20',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Autopista al aeropuerto No. 1111 Nexxus Guadalupe, Nuevo Léon C.P. 67130.',
                    'latitud' => 25.67680000,
                    'longitud' => -100.25650000,
                    'telefono' => '+52 81 8144 5020',
                ],
                [
                    'id' => 21,
                    'nombre' => 'CONSUMER PACKAGING NAUCALPAN (LSKM)',
                    'codigo_numeral' => '21',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. 16 de Septiembre 25 Col. Industrial Naucalpan 3a. Sección, Naucalpan Edo. Méx.',
                    'latitud' => 19.47850000,
                    'longitud' => -99.23960000,
                    'telefono' => '+52 55 5699 1221',
                ],
                [
                    'id' => 22,
                    'nombre' => 'CONSUMER PACKAGING NAVA (LWRK)',
                    'codigo_numeral' => '22',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Carretera Federal 57 Nava Piedras Negras Km 239 + 100, número: 23910, Col. Ejido San Ramón, Coahuila, C.P. 26170.',
                    'latitud' => 28.70000000,
                    'longitud' => -100.52350000,
                    'telefono' => '+52 878 782 5022',
                ],
                [
                    'id' => 23,
                    'nombre' => 'CONSUMER PACKAGING SAN LUIS POTOSI (LWRK)',
                    'codigo_numeral' => '23',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'AV PROMOCION No.310 ZONA INDUSTRIAL PRIMERA SECCION San Luis Potosí C.P. 78395.',
                    'latitud' => 22.15650000,
                    'longitud' => -100.98550000,
                    'telefono' => '+52 444 824 5023',
                ],
                [
                    'id' => 24,
                    'nombre' => 'CONSUMER PACKAGING TIJUANA (LSKNA)',
                    'codigo_numeral' => '24',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Blvd. Bellas artes 20377 Ciudad industrial 22444, Tijuana, Baja California.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3124',
                ],
                [
                    'id' => 25,
                    'nombre' => 'CORPORATIVO TERRET (LSKM)',
                    'codigo_numeral' => '25',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Blvd. Miguel de Cervantes Saavedra, Moderna, Miguel Hidalgo, 11520 Ciudad de México, CDMX',
                    'latitud' => 19.43260000,
                    'longitud' => -99.19480000,
                    'telefono' => '+52 55 5699 1225',
                ],
                [
                    'id' => 26,
                    'nombre' => 'CORRUGADO CELAYA (LWRK)',
                    'codigo_numeral' => '26',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Concepción Beistegui KM 2.5, Zona Industrial Poniente, Celaya, Gto. CP 38024.',
                    'latitud' => 20.52220000,
                    'longitud' => -100.81220000,
                    'telefono' => '+52 461 618 3026',
                ],
                [
                    'id' => 27,
                    'nombre' => 'CORRUGADO CUAUTITLAN (LWRK)',
                    'codigo_numeral' => '27',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Calle Canal S/N, Col. San Mateo Ixtacalco, Cuautitlán Izcalli, Estado de México, CP 54713.',
                    'latitud' => 19.39530000,
                    'longitud' => -99.09170000,
                    'telefono' => '+52 55 5699 1227',
                ],
                [
                    'id' => 28,
                    'nombre' => 'CORRUGADO JUAREZ (LSKNA)',
                    'codigo_numeral' => '28',
                    'zona_horaria' => 'America/Ciudad_Juarez',
                    'direccion' => 'Carretera Panamericana 9031 B, 32685 Parque industrial aeropuerto, Juarez Chihuahua.',
                    'latitud' => 31.69040000,
                    'longitud' => -106.42450000,
                    'telefono' => '+52 656 629 8028',
                ],
                [
                    'id' => 29,
                    'nombre' => 'CORRUGADO JUAREZ – BODEGA CAMARGO (LSKNA)',
                    'codigo_numeral' => '29',
                    'zona_horaria' => 'America/Chihuahua',
                    'direccion' => 'Callejon del cementerio  8 revolucion 33740, camargo, chihuahua.',
                    'latitud' => 27.67830000,
                    'longitud' => -105.17140000,
                    'telefono' => '+52 55 5699 1229',
                ],
                [
                    'id' => 30,
                    'nombre' => 'CORRUGADO JUAREZ – BODEGA CHIHUAHUA (LSKNA)',
                    'codigo_numeral' => '30',
                    'zona_horaria' => 'America/Chihuahua',
                    'direccion' => 'Periferico de la juventud s/n saucito 31110, chihuahua, chihuahua.',
                    'latitud' => 28.63530000,
                    'longitud' => -106.08890000,
                    'telefono' => '+52 656 629 8030',
                ],
                [
                    'id' => 31,
                    'nombre' => 'CORRUGADO LA PAZ (LWRK)',
                    'codigo_numeral' => '31',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Calle de las flores # 42, Los Reyes Acaquilpan Edo. de México, Municipio La Paz C.P. 56400.',
                    'latitud' => 19.36000000,
                    'longitud' => -98.98000000,
                    'telefono' => '+52 55 5699 1231',
                ],
                [
                    'id' => 32,
                    'nombre' => 'CORRUGADO MEXICALI I (LSKNA)',
                    'codigo_numeral' => '32',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Cerrada Centinela 1799, Parque Inustrial Cachanilla 21600, Mexicali, Baja California.',
                    'latitud' => 32.65190000,
                    'longitud' => -115.46830000,
                    'telefono' => '+52 686 561 2432',
                ],
                [
                    'id' => 33,
                    'nombre' => 'CORRUGADO MEXICALI II (LWRK)',
                    'codigo_numeral' => '33',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Av. Club de Columnistas 900, Fracc. Ignacio Allende, Mexicali, B.C. C.P. 21390.',
                    'latitud' => 32.65190000,
                    'longitud' => -115.46830000,
                    'telefono' => '+52 686 561 2433',
                ],
                [
                    'id' => 34,
                    'nombre' => 'CORRUGADO MXLI - BODEGA EL DORADO (LSKNA)',
                    'codigo_numeral' => '34',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'El dorado 72 parque ind el dorado 21190, mexicali, baja california.',
                    'latitud' => 32.65190000,
                    'longitud' => -115.46830000,
                    'telefono' => '+52 686 561 2434',
                ],
                [
                    'id' => 35,
                    'nombre' => 'CORRUGADO MXLI - BODEGA EL VALLE (LSKNA)',
                    'codigo_numeral' => '35',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Carretera km 8.5 carretera san luis rio colorado, el llanito, mexicali, c.p 21840.',
                    'latitud' => 32.65190000,
                    'longitud' => -115.46830000,
                    'telefono' => '+52 686 561 2435',
                ],
                [
                    'id' => 36,
                    'nombre' => 'CORRUGADO NOGALES',
                    'codigo_numeral' => '36',
                    'zona_horaria' => 'America/Hermosillo',
                    'direccion' => 'Luis Donaldo Colosio Murrieta 1850 Encinos 84064, Nogales Sonora.',
                    'latitud' => 31.30860000,
                    'longitud' => -110.94220000,
                    'telefono' => '+52 631 311 4536',
                ],
                [
                    'id' => 37,
                    'nombre' => 'CORRUGADO NUEVO LAREDO (LSKNA)',
                    'codigo_numeral' => '37',
                    'zona_horaria' => 'America/Matamoros',
                    'direccion' => 'New York 203, 88285, Nuevo Laredo, Tamaulipas.',
                    'latitud' => 27.47630000,
                    'longitud' => -99.51640000,
                    'telefono' => '+52 867 711 4037',
                ],
                [
                    'id' => 38,
                    'nombre' => 'CORRUGADO NUEVO LEON – BODEGA REYNOSA (LSKNA)',
                    'codigo_numeral' => '38',
                    'zona_horaria' => 'America/Matamoros',
                    'direccion' => 'Avenida el puente 215 a parque industrial el puente reynosa tamaulipas 88783.',
                    'latitud' => 26.08060000,
                    'longitud' => -98.28830000,
                    'telefono' => '+52 867 711 4038',
                ],
                [
                    'id' => 39,
                    'nombre' => 'CORRUGADO TIJUANA (LSKNA)',
                    'codigo_numeral' => '39',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Seis Oriente 19026, Ciudad Industrial, C.P.  22444, Tijuana, Baja California.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3139',
                ],
                [
                    'id' => 40,
                    'nombre' => 'CORRUGADO TIJUANA – BODEGA 2 (LSKNA)',
                    'codigo_numeral' => '40',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Cinco sur 1170, ciudad industrial, c.p. 22444, tijuana, baja california.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3140',
                ],
                [
                    'id' => 41,
                    'nombre' => 'CORRUGADO TIJUANA – BODEGA 6 (LSKNA)',
                    'codigo_numeral' => '41',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => '6 oriente 20052 ciudad industrial 22444,tijuana baja california.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3141',
                ],
                [
                    'id' => 42,
                    'nombre' => 'Consumer Obregón',
                    'codigo_numeral' => '42',
                    'zona_horaria' => 'America/Hermosillo',
                    'direccion' => 'Calzada Francisco Villanueva Castelo 4009 Oriente Entre Calle 12 y Canal Alto Parque Industrial Cd. Obregón Ampliación Cd. Obregón, Sonora, C.P. 85065',
                    'latitud' => 27.48640000,
                    'longitud' => -109.94080000,
                    'telefono' => '+52 631 311 4542',
                ],
                [
                    'id' => 43,
                    'nombre' => 'Consumer Packaging Guadalajara',
                    'codigo_numeral' => '43',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Dr. Angel Leaño 401 Colonia Los Robles Zapopan Jalisco C.P. 45134.',
                    'latitud' => 20.71670000,
                    'longitud' => -103.40000000,
                    'telefono' => '+52 33 3847 2043',
                ],
                [
                    'id' => 44,
                    'nombre' => 'Consumer Packaging Los Reyes',
                    'codigo_numeral' => '44',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Calle de las flores # 42, Los Reyes Acaquilpan Edo. de México, Municipio La Paz C.P. 56400.',
                    'latitud' => 19.36000000,
                    'longitud' => -98.98000000,
                    'telefono' => '+52 55 5699 1244',
                ],
                [
                    'id' => 45,
                    'nombre' => 'Corrugado Atlacomulco',
                    'codigo_numeral' => '45',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Blvd. Salvador Sánchez Colin 1011, Mza. 24A Parque Industrial, Atlacomulco, Edo. Méx.',
                    'latitud' => 19.79690000,
                    'longitud' => -99.87420000,
                    'telefono' => '+52 55 5699 1245',
                ],
                [
                    'id' => 46,
                    'nombre' => 'Corrugado Atlas',
                    'codigo_numeral' => '46',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Emiliano Zapata 71, San Jeronimo Tepetlalco, Tlanepantla, Edo.Méx.',
                    'latitud' => 19.54000000,
                    'longitud' => -99.19000000,
                    'telefono' => '+52 55 5699 1246',
                ],
                [
                    'id' => 47,
                    'nombre' => 'Corrugado Cerro Gordo',
                    'codigo_numeral' => '47',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Hidalgo 91, Santa Clara, C.P. 55540, Ecatepec, Edo. Méx.',
                    'latitud' => 19.53120000,
                    'longitud' => -99.03450000,
                    'telefono' => '+52 55 5699 1247',
                ],
                [
                    'id' => 48,
                    'nombre' => 'Corrugado Culiacán',
                    'codigo_numeral' => '48',
                    'zona_horaria' => 'America/Mazatlan',
                    'direccion' => 'Km. 9.9 Carr. Culiacán-El Dorado, Culíacán Sin.',
                    'latitud' => 24.80910000,
                    'longitud' => -107.39400000,
                    'telefono' => '+52 667 760 1148',
                ],
                [
                    'id' => 49,
                    'nombre' => 'Corrugado El Salto',
                    'codigo_numeral' => '49',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Km 7.3 Carretera Guadalajara el Salto, El Salto, Jalisco, C.P. 45686.',
                    'latitud' => 20.51860000,
                    'longitud' => -103.18190000,
                    'telefono' => '+52 33 3847 2049',
                ],
                [
                    'id' => 50,
                    'nombre' => 'Corrugado Guadalajara',
                    'codigo_numeral' => '50',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Km. 1.2 Carretera Tala a San Isidro Mazatepec, Tala Jalisco.',
                    'latitud' => 20.65580000,
                    'longitud' => -103.70250000,
                    'telefono' => '+52 33 3847 2050',
                ],
                [
                    'id' => 51,
                    'nombre' => 'Corrugado Guadalupe',
                    'codigo_numeral' => '51',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Av., Dia del Empresario 951, Col. Jardines de Guadalupe, Guadalupe N.L.',
                    'latitud' => 25.67680000,
                    'longitud' => -100.25650000,
                    'telefono' => '+52 81 8144 5051',
                ],
                [
                    'id' => 52,
                    'nombre' => 'Corrugado Guanajuato',
                    'codigo_numeral' => '52',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Km. 57 Carretera Qro. San luis Potosí, 37980, San José Iturbide, Gto.',
                    'latitud' => 21.00060000,
                    'longitud' => -100.38390000,
                    'telefono' => '+52 461 618 3052',
                ],
                [
                    'id' => 53,
                    'nombre' => 'Corrugado San Pablo',
                    'codigo_numeral' => '53',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Prolongación poniente 150 sn, San Pablo Xalpa, Tlalnepantla, Edo. De México, CP 54090.',
                    'latitud' => 19.54000000,
                    'longitud' => -99.19000000,
                    'telefono' => '+52 55 5699 1253',
                ],
                [
                    'id' => 54,
                    'nombre' => 'Corrugado los Reyes',
                    'codigo_numeral' => '54',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Presidente Juárez 2030, Los Reyes Iztacala, C.P. 54090 Tlanepantla, Edo. Méx.',
                    'latitud' => 19.54000000,
                    'longitud' => -99.19000000,
                    'telefono' => '+52 55 5699 1254',
                ],
                [
                    'id' => 55,
                    'nombre' => 'FIBRAS ACAPULCO (BODEGA) (LSKM)',
                    'codigo_numeral' => '55',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Calle 5 esq. Emiliano Zapata S/N Col. Bellavista, Acapulco Gro.',
                    'latitud' => 16.85310000,
                    'longitud' => -99.82370000,
                    'telefono' => '+52 744 485 2055',
                ],
                [
                    'id' => 56,
                    'nombre' => 'Fibras Cerro Gordo',
                    'codigo_numeral' => '56',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Hidalgo 91, Santa Clara, C.P. 55540, Ecatepec, Edo. Méx.',
                    'latitud' => 19.53120000,
                    'longitud' => -99.03450000,
                    'telefono' => '+52 55 5699 1256',
                ],
                [
                    'id' => 57,
                    'nombre' => 'MOLINO GUADALUPE (LWRK)',
                    'codigo_numeral' => '57',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Autopista al aeropuerto No. 1111 Nexxus Guadalupe, Nuevo Léon C.P. 67130.',
                    'latitud' => 25.67680000,
                    'longitud' => -100.25650000,
                    'telefono' => '+52 81 8144 5057',
                ],
                [
                    'id' => 58,
                    'nombre' => 'MOLINO SAN LUIS POTOSI (LWRK)',
                    'codigo_numeral' => '58',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Eje 114 230 Zona Industrial San Luis, Potosí, México, CP 78395.',
                    'latitud' => 22.15650000,
                    'longitud' => -100.98550000,
                    'telefono' => '+52 444 824 5058',
                ],
                [
                    'id' => 59,
                    'nombre' => 'Molino Cerro Gordo',
                    'codigo_numeral' => '59',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Hidalgo 91, Santa Clara, C.P. 55540, Ecatepec, Edo. Méx.',
                    'latitud' => 19.53120000,
                    'longitud' => -99.03450000,
                    'telefono' => '+52 55 5699 1259',
                ],
                [
                    'id' => 60,
                    'nombre' => 'Molino San Pablo',
                    'codigo_numeral' => '60',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Prolongación poniente 150 sn, San Pablo Xalpa, Tlalnepantla, Edo. De México, CP 54090.',
                    'latitud' => 19.54000000,
                    'longitud' => -99.19000000,
                    'telefono' => '+52 55 5699 1260',
                ],
                [
                    'id' => 61,
                    'nombre' => 'Molino los Reyes',
                    'codigo_numeral' => '61',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Av. Presidente Juárez 2030, Los Reyes Iztacala, C.P. 54090 Tlanepantla, Edo. Méx.',
                    'latitud' => 19.54000000,
                    'longitud' => -99.19000000,
                    'telefono' => '+52 55 5699 1261',
                ],
                [
                    'id' => 62,
                    'nombre' => 'PACKAGING SOLUTIONS MONTERREY',
                    'codigo_numeral' => '62',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Blvd. Apodaca 902  Apodaca technology park 66600, Apodaca, nuevo león.',
                    'latitud' => 25.78140000,
                    'longitud' => -100.18860000,
                    'telefono' => '+52 81 8144 5062',
                ],
                [
                    'id' => 63,
                    'nombre' => 'PACKAGING SOLUTIONS TIJUANA (Corp IT 2do Piso) (LSKNA)',
                    'codigo_numeral' => '63',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'C 12 norte 106, ciudad industrial, c.p. 22444,tijuana, baja california.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3163',
                ],
                [
                    'id' => 64,
                    'nombre' => 'PS HONEYCOMB MONTERREY',
                    'codigo_numeral' => '64',
                    'zona_horaria' => 'America/Monterrey',
                    'direccion' => 'Blvd. parque industrial monterrey 308, apodaca centro c.p 66600, apodaca, nuevo leon.',
                    'latitud' => 25.78140000,
                    'longitud' => -100.18860000,
                    'telefono' => '+52 81 8144 5064',
                ],
                [
                    'id' => 65,
                    'nombre' => 'PS HONEYCOMB TIJUANA',
                    'codigo_numeral' => '65',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Blvd. Bellas artes 20377 Ciudad industrial 22444, Tijuana, Baja California.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3165',
                ],
                [
                    'id' => 66,
                    'nombre' => 'PS TIJUANA - BODEGA 4',
                    'codigo_numeral' => '66',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'C 12 norte 106, ciudad industrial, c.p. 22444,tijuana, baja california.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3166',
                ],
                [
                    'id' => 67,
                    'nombre' => 'TOOLING TIJUANA (LSKNA)',
                    'codigo_numeral' => '67',
                    'zona_horaria' => 'America/Tijuana',
                    'direccion' => 'Seis Oriente 19031, Ciudad Industrial 22444, Tijuana, Baja California.',
                    'latitud' => 32.51490000,
                    'longitud' => -116.97440000,
                    'telefono' => '+52 664 647 3167',
                ],
                [
                    'id' => 68,
                    'nombre' => 'Torre Esmeralda',
                    'codigo_numeral' => '68',
                    'zona_horaria' => 'America/Mexico_City',
                    'direccion' => 'Boulevard Manuel Avila Camacho No. 36 Piso 21 Col. Lomas de Chapultepec CP 11000 Delegación Miguel Hidalgo, CDMX',
                    'latitud' => 19.43260000,
                    'longitud' => -99.19480000,
                    'telefono' => '+52 55 5699 1268',
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

            $this->command?->info("Vinculando {$empleados->count()} colaboradores entre las {$numSucursales} plantas de Smurfit Westrock...");

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
            $hoy = Carbon::today();
            $calculoService = app(CalculoAsistenciaLftService::class);

            $casosPrueba = [
                1 => ['minutos_entrada' => 1, 'comentario' => 'Tijuana BIB - Noroeste UTC-8/7 (07:01 Tijuana - Puntual)'],
                4 => ['minutos_entrada' => 2, 'comentario' => 'Cancún - Sureste UTC-5 (07:02 Cancún - Puntual)'],
                18 => ['minutos_entrada' => 3, 'comentario' => 'Cerro Gordo Consumer - Centro UTC-6 (07:03 CDMX - Puntual)'],
                19 => ['minutos_entrada' => 6, 'comentario' => 'Monterrey Consumer - Noreste UTC-6 (07:06 MTY - Puntual)'],
                24 => ['minutos_entrada' => 4, 'comentario' => 'Tijuana Consumer - Noroeste UTC-8/7 (07:04 Tijuana - Puntual)'],
                28 => ['minutos_entrada' => 18, 'comentario' => 'Cd. Juárez - Frontera UTC-7/6 (07:18 Juárez - Retardo con tolerancia)'],
                29 => ['minutos_entrada' => 5, 'comentario' => 'Camargo - Chihuahua UTC-6 (07:05 Camargo - Puntual)'],
                36 => ['minutos_entrada' => 0, 'comentario' => 'Nogales - Sonora UTC-7 fijo (07:00 Nogales - Puntual Exacto)'],
                37 => ['minutos_entrada' => 7, 'comentario' => 'Nuevo Laredo - Frontera Tamaulipas UTC-6/5 (07:07 Laredo - Puntual)'],
                48 => ['minutos_entrada' => 4, 'comentario' => 'Culiacán - Sinaloa UTC-7 fijo (07:04 Culiacán - Puntual)'],
            ];

            foreach ($casosPrueba as $sucursalId => $infoCaso) {
                $empleadoPlanta = Empleado::where('empresa_id', $empresa->id)
                    ->where('sucursal_id', $sucursalId)
                    ->first();

                if (! $empleadoPlanta) {
                    continue;
                }

                $sucursal = $sucursalesModelos[$sucursalId] ?? null;
                if (! $sucursal) {
                    continue;
                }
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
            $this->command?->info("🏭 Total de Plantas / Sucursales creadas desde Excel Detail2: {$numSucursales}");
            $this->command?->info("👥 {$empleados->count()} colaboradores distribuidos entre las plantas.");
            $this->command?->info('⏱️ Marcajes demostrativos generados con husos horarios locales validados.');
            $this->command?->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command?->error("❌ Error en SucursalesSmurfitSeeder: {$e->getMessage()}");
            throw $e;
        }
    }
}
