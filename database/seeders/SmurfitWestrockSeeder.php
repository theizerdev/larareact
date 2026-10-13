<?php

namespace Database\Seeders;

use App\Models\Cargo;
use App\Models\Departamento;
use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Responsable;
use App\Models\Sucursal;
use App\Models\User;
use App\Services\AccessCodeService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SmurfitWestrockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Asegurar País México (+52)
        $paisMexico = Pais::where('codigo_iso2', 'MX')->first()
            ?? Pais::where('codigo_telefonico', '+52')->first();

        if (! $paisMexico) {
            $paisMexico = Pais::create([
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
        }

        // 2. Asegurar Empresa Smurfit Westrock
        $empresa = Empresa::where('razon_social', 'like', '%Smurfit%')->first()
            ?? Empresa::firstOrCreate(
                ['id' => 1],
                [
                    'razon_social' => 'Smurfit Westrock',
                    'documento' => 'SWE-850101-ABC',
                    'direccion' => 'Carretera Toluca-México Km 58.5, Lerma, Estado de México',
                    'telefono' => '722 279 5000',
                    'email' => 'contacto.mexico@smurfitwestrock.com',
                    'status' => true,
                ]
            );

        // 3. Asegurar Sucursal Principal de Smurfit Westrock
        $sucursal = Sucursal::where('empresa_id', $empresa->id)->first()
            ?? Sucursal::firstOrCreate(
                ['id' => 1],
                [
                    'empresa_id' => $empresa->id,
                    'nombre' => 'Planta Empaques México',
                    'telefono' => '722 279 5001',
                    'direccion' => 'Parque Industrial Lerma, Estado de México',
                    'status' => true,
                    'codigo_numeral' => '01',
                ]
            );

        if (empty($sucursal->codigo_numeral)) {
            $sucursal->update(['codigo_numeral' => '01']);
        }

        // 4. Usuario para auditoría / multitenant
        $user = User::where('empresa_id', $empresa->id)->first()
            ?? User::first()
            ?? User::create([
                'name' => 'Administrador Smurfit',
                'username' => 'admin_smurfit',
                'email' => 'admin@smurfitwestrock.com',
                'password' => bcrypt('password'),
                'status' => 'activo',
                'empresa_id' => $empresa->id,
                'sucursal_id' => $sucursal->id,
            ]);

        // 5. Estructura Organizacional: Departamentos, Cargos, Responsables y Colaboradores
        $departamentosData = [
            [
                'codigo' => 'DEP-CORR',
                'nombre' => 'Operaciones y Corrugado',
                'descripcion' => 'Fabricación continua de láminas de cartón corrugado, flautas y empaques de alta resistencia.',
                'ubicacion' => 'Nave Industrial Principal A - Línea Continua de Corrugado',
                'piso' => 'Planta Baja',
                'latitud' => 19.28450000,
                'longitud' => -99.51080000,
                'responsable' => [
                    'nombres' => 'Mateo',
                    'apellidos' => 'Villanueva Reyes',
                    'documento_identidad' => 'VIRM820314HR8',
                    'telefono' => '55 4182 9301',
                    'correo' => 'mateo.villanueva@smurfitwestrock.com',
                    'cargo_nombre' => 'Superintendente de Operaciones y Corrugado',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Superintendente de Operaciones y Corrugado',
                        'descripcion' => 'Liderazgo operativo del proceso de corrugado, cumplimiento del OEE y eficiencia de planta.',
                    ],
                    [
                        'nombre' => 'Supervisor de Turno de Corrugado',
                        'descripcion' => 'Supervisión en piso de la velocidad de corrida, cambio de bobinas y control de mermas.',
                    ],
                    [
                        'nombre' => 'Operador Maestro de Máquina Corrugadora',
                        'descripcion' => 'Operación del cabezal simple, doble facer, ajuste de cuchillas rotativas y control de vapor.',
                    ],
                    [
                        'nombre' => 'Maquinista de Encoladora y Empalme Automático',
                        'descripcion' => 'Control de viscosidad de goma de almidón y empalme automático de bobinas krafft.',
                    ],
                    [
                        'nombre' => 'Ayudante General de Producción',
                        'descripcion' => 'Apoyo en estiba, etiquetado de tarimas y orden en final de línea de corrugado.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Juan Carlos',
                        'apellidos' => 'Morales Bautista',
                        'documento_identidad' => 'SW-MX-1001',
                        'curp_base' => 'MOBJ890412HDFRRL0',
                        'telefono' => '55 5293 8410',
                        'correo' => 'juan.morales@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Supervisor de Turno de Corrugado',
                        'salario_diario' => 650.00,
                        'fecha_ingreso' => '2022-03-01',
                        'jornada_laboral' => ['tipo' => 'Turno Rotativo 1', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'José Luis',
                        'apellidos' => 'Domínguez Téllez',
                        'documento_identidad' => 'SW-MX-1002',
                        'curp_base' => 'DOTJ920823HMCMLZ0',
                        'telefono' => '722 349 1827',
                        'correo' => 'jose.dominguez@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Operador Maestro de Máquina Corrugadora',
                        'salario_diario' => 540.00,
                        'fecha_ingreso' => '2022-07-15',
                        'jornada_laboral' => ['tipo' => 'Turno Rotativo 1', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Luis Ángel',
                        'apellidos' => 'Ramírez Colín',
                        'documento_identidad' => 'SW-MX-1003',
                        'curp_base' => 'RACL951105HMCNGL0',
                        'telefono' => '722 491 8230',
                        'correo' => 'luis.ramirez@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Maquinista de Encoladora y Empalme Automático',
                        'salario_diario' => 490.00,
                        'fecha_ingreso' => '2023-01-10',
                        'jornada_laboral' => ['tipo' => 'Turno Rotativo 2', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Andrea',
                        'apellidos' => 'Salgado Beltrán',
                        'documento_identidad' => 'SW-MX-1004',
                        'curp_base' => 'SABA980218MMCLNR0',
                        'telefono' => '55 6182 9403',
                        'correo' => 'andrea.salgado@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Ayudante General de Producción',
                        'salario_diario' => 430.00,
                        'fecha_ingreso' => '2023-09-01',
                        'jornada_laboral' => ['tipo' => 'Turno Matutino', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-CONV',
                'nombre' => 'Conversión, Impresión y Troquelado',
                'descripcion' => 'Transformación de láminas en cajas plegadizas y corrugadas con impresión flexográfica de alta gráfica.',
                'ubicacion' => 'Nave Industrial B - Área de Flexografía y Troqueles',
                'piso' => 'Planta Baja',
                'latitud' => 19.28470000,
                'longitud' => -99.51040000,
                'responsable' => [
                    'nombres' => 'Valeria',
                    'apellidos' => 'Quintana Paredes',
                    'documento_identidad' => 'QUIP840722M43',
                    'telefono' => '81 8392 4150',
                    'correo' => 'valeria.quintana@smurfitwestrock.com',
                    'cargo_nombre' => 'Jefe de Conversión y Acabados',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Jefe de Conversión y Acabados',
                        'descripcion' => 'Dirección de líneas de impresoras flexográficas, troqueladoras rotativas y plegadoras.',
                    ],
                    [
                        'nombre' => 'Supervisor de Impresión Flexográfica',
                        'descripcion' => 'Verificación de tonalidad Pantone, viscosidad de tintas al agua y registro de clisés.',
                    ],
                    [
                        'nombre' => 'Técnico Troquelador Rotativo y Plano',
                        'descripcion' => 'Montaje de herramentales de corte, gomas expulsoras y calibración de presión.',
                    ],
                    [
                        'nombre' => 'Operador de Pegadora y Plegadora Automática',
                        'descripcion' => 'Operación de equipos automáticos de aplicación de hot-melt y empaque flejado.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Eduardo',
                        'apellidos' => 'Carvajal Soto',
                        'documento_identidad' => 'SW-MX-2001',
                        'curp_base' => 'CASE900315HDFRRD0',
                        'telefono' => '81 8120 9483',
                        'correo' => 'eduardo.carvajal@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Supervisor de Impresión Flexográfica',
                        'salario_diario' => 610.00,
                        'fecha_ingreso' => '2021-11-15',
                        'jornada_laboral' => ['tipo' => 'Turno Mixto', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Miguel Ángel',
                        'apellidos' => 'Cárdenas Rosales',
                        'documento_identidad' => 'SW-MX-2002',
                        'curp_base' => 'CARM930919HNLRSN0',
                        'telefono' => '81 8493 2011',
                        'correo' => 'miguel.cardenas@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Técnico Troquelador Rotativo y Plano',
                        'salario_diario' => 530.00,
                        'fecha_ingreso' => '2022-04-18',
                        'jornada_laboral' => ['tipo' => 'Turno Mixto', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Gabriela',
                        'apellidos' => 'Nava Espinoza',
                        'documento_identidad' => 'SW-MX-2003',
                        'curp_base' => 'NAEG961201MNLVLS0',
                        'telefono' => '81 8219 4038',
                        'correo' => 'gabriela.nava@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Operador de Pegadora y Plegadora Automática',
                        'salario_diario' => 480.00,
                        'fecha_ingreso' => '2023-05-02',
                        'jornada_laboral' => ['tipo' => 'Turno Matutino', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-MTTO',
                'nombre' => 'Mantenimiento Industrial y Confiabilidad',
                'descripcion' => 'Preservación electromecánica de la maquinaria pesada, calderas, sistemas de vapor y automatización.',
                'ubicacion' => 'Taller Central de Mantenimiento y Subestación Eléctrica',
                'piso' => 'Planta Baja',
                'latitud' => 19.28420000,
                'longitud' => -99.51120000,
                'responsable' => [
                    'nombres' => 'Carlos',
                    'apellidos' => 'Treviño Montemayor',
                    'documento_identidad' => 'TRMC791108KL5',
                    'telefono' => '81 8320 6710',
                    'correo' => 'carlos.trevino@smurfitwestrock.com',
                    'cargo_nombre' => 'Gerente de Mantenimiento y Confiabilidad',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Gerente de Mantenimiento y Confiabilidad',
                        'descripcion' => 'Planeación del mantenimiento mayor, paros programados y administración de activos críticos.',
                    ],
                    [
                        'nombre' => 'Especialista en Automatización y PLC',
                        'descripcion' => 'Programación y soporte de controladores Siemens y Allen Bradley en corrugadoras y empacadoras.',
                    ],
                    [
                        'nombre' => 'Técnico Electromecánico Industrial',
                        'descripcion' => 'Reparación de reductores, rodamientos de alta temperatura y líneas de vapor presurizado.',
                    ],
                    [
                        'nombre' => 'Técnico en Mantenimiento Predictivo y Vibraciones',
                        'descripcion' => 'Monitoreo de análisis vibracional, termografía infrarroja y ultrasonido de rodamientos.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Ricardo',
                        'apellidos' => 'Ponce Guajardo',
                        'documento_identidad' => 'SW-MX-3001',
                        'curp_base' => 'POGR880620HNLNCD0',
                        'telefono' => '81 8349 1029',
                        'correo' => 'ricardo.ponce@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Especialista en Automatización y PLC',
                        'salario_diario' => 700.00,
                        'fecha_ingreso' => '2020-08-10',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Héctor Manuel',
                        'apellidos' => 'Esquivel Lara',
                        'documento_identidad' => 'SW-MX-3002',
                        'curp_base' => 'EQLH920114HNLSRT0',
                        'telefono' => '81 8234 5091',
                        'correo' => 'hector.esquivel@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Técnico Electromecánico Industrial',
                        'salario_diario' => 580.00,
                        'fecha_ingreso' => '2022-02-14',
                        'jornada_laboral' => ['tipo' => 'Turno Rotativo 1', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Daniel',
                        'apellidos' => 'Zepeda Ibarra',
                        'documento_identidad' => 'SW-MX-3003',
                        'curp_base' => 'ZEID940528HDFPRN0',
                        'telefono' => '55 5491 8230',
                        'correo' => 'daniel.zepeda@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Técnico en Mantenimiento Predictivo y Vibraciones',
                        'salario_diario' => 560.00,
                        'fecha_ingreso' => '2023-04-01',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-CALI',
                'nombre' => 'Calidad, Laboratorio y Mejora Continua',
                'descripcion' => 'Verificación de resistencia física (ECT, BCT, Mullen, Cobb) y aseguramiento de estándares ISO 9001.',
                'ubicacion' => 'Laboratorio Técnico de Control de Calidad',
                'piso' => 'Piso 1',
                'latitud' => 19.28490000,
                'longitud' => -99.51020000,
                'responsable' => [
                    'nombres' => 'Sofía',
                    'apellidos' => 'Valenzuela Ochoa',
                    'documento_identidad' => 'VAOS850912GT4',
                    'telefono' => '33 3615 8890',
                    'correo' => 'sofia.valenzuela@smurfitwestrock.com',
                    'cargo_nombre' => 'Coordinador de Aseguramiento de Calidad',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Coordinador de Aseguramiento de Calidad',
                        'descripcion' => 'Certificaciones de empaque grado alimenticio, farmacológico e industrial y auditorías de cliente.',
                    ],
                    [
                        'nombre' => 'Analista de Laboratorio de Papel y Cartón',
                        'descripcion' => 'Ejecución de pruebas de compresión de canto (ECT), resistencia al estallamiento y absorción de agua.',
                    ],
                    [
                        'nombre' => 'Inspector de Control de Calidad en Línea',
                        'descripcion' => 'Inspección de pegado, dobleces, colorimetría e identificación de defectos en tiempo real.',
                    ],
                    [
                        'nombre' => 'Ingeniero de Mejora Continua y Six Sigma',
                        'descripcion' => 'Proyectos Kaizen para reducción de scrap de papel y estandarización de procesos productivos.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Diana Laura',
                        'apellidos' => 'Méndez Coronado',
                        'documento_identidad' => 'SW-MX-4001',
                        'curp_base' => 'MECD930810MJCLRN0',
                        'telefono' => '33 3491 2084',
                        'correo' => 'diana.mendez@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Analista de Laboratorio de Papel y Cartón',
                        'salario_diario' => 540.00,
                        'fecha_ingreso' => '2021-06-01',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Rodrigo',
                        'apellidos' => 'Aguilar Fuentes',
                        'documento_identidad' => 'SW-MX-4002',
                        'curp_base' => 'AUFR960224HJCGND0',
                        'telefono' => '33 3810 4920',
                        'correo' => 'rodrigo.aguilar@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Inspector de Control de Calidad en Línea',
                        'salario_diario' => 470.00,
                        'fecha_ingreso' => '2022-10-10',
                        'jornada_laboral' => ['tipo' => 'Turno Mixto', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Paulina',
                        'apellidos' => 'Castro Villegas',
                        'documento_identidad' => 'SW-MX-4003',
                        'curp_base' => 'CAVP910403MJCSLG0',
                        'telefono' => '33 3192 8401',
                        'correo' => 'paulina.castro@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Ingeniero de Mejora Continua y Six Sigma',
                        'salario_diario' => 660.00,
                        'fecha_ingreso' => '2023-02-01',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-EHSS',
                'nombre' => 'Seguridad, Salud Ocupacional y Medio Ambiente (EHS)',
                'descripcion' => 'Prevención de accidentes industriales, cumplimiento de normas STPS, brigadas y manejo ambiental.',
                'ubicacion' => 'Edificio de Seguridad Industrial y Servicio Médico',
                'piso' => 'Planta Baja',
                'latitud' => 19.28410000,
                'longitud' => -99.51010000,
                'responsable' => [
                    'nombres' => 'Daniel',
                    'apellidos' => 'Estrada Navarro',
                    'documento_identidad' => 'EAND810629RT1',
                    'telefono' => '722 214 7654',
                    'correo' => 'daniel.estrada@smurfitwestrock.com',
                    'cargo_nombre' => 'Jefe de Seguridad Industrial, Salud y EHS',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Jefe de Seguridad Industrial, Salud y EHS',
                        'descripcion' => 'Gestión integral del programa de Cero Accidentes, protocolos de bloqueo LOTO y cumplimiento ambiental.',
                    ],
                    [
                        'nombre' => 'Supervisor de Seguridad e Higiene Industrial',
                        'descripcion' => 'Recorridos de seguridad en áreas de alta energía, permisos de trabajo seguro y control de EPP.',
                    ],
                    [
                        'nombre' => 'Médico Laboral y Ocupacional',
                        'descripcion' => 'Atención médica a colaboradores, exámenes periódicos de audiometría y control de salud laboral.',
                    ],
                    [
                        'nombre' => 'Analista de Sustentabilidad y Huella de Carbono',
                        'descripcion' => 'Seguimiento al reciclaje de papel, planta de tratamiento de aguas y metas de reducción de emisiones.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Jorge Alberto',
                        'apellidos' => 'Ríos Benítez',
                        'documento_identidad' => 'SW-MX-5001',
                        'curp_base' => 'RIBJ891012HMCRNR0',
                        'telefono' => '722 390 1824',
                        'correo' => 'jorge.rios@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Supervisor de Seguridad e Higiene Industrial',
                        'salario_diario' => 590.00,
                        'fecha_ingreso' => '2021-08-16',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Claudia',
                        'apellidos' => 'Toledo Santana',
                        'documento_identidad' => 'SW-MX-5002',
                        'curp_base' => 'TOSC870519MMCLNT0',
                        'telefono' => '722 419 8201',
                        'correo' => 'claudia.toledo@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Médico Laboral y Ocupacional',
                        'salario_diario' => 740.00,
                        'fecha_ingreso' => '2022-01-10',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Brenda',
                        'apellidos' => 'Pineda Galarza',
                        'documento_identidad' => 'SW-MX-5003',
                        'curp_base' => 'PIGB941128MMCNLR0',
                        'telefono' => '55 4910 8243',
                        'correo' => 'brenda.pineda@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Analista de Sustentabilidad y Huella de Carbono',
                        'salario_diario' => 560.00,
                        'fecha_ingreso' => '2023-03-20',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-LOGI',
                'nombre' => 'Cadena de Suministro, Almacén y Embarques',
                'descripcion' => 'Recepción de bobinas de papel, almacén de producto terminado y distribución de cajas corrugadas a clientes.',
                'ubicacion' => 'Centro de Distribución (CEDIS) y Andenes de Despacho C',
                'piso' => 'Planta Baja',
                'latitud' => 19.28440000,
                'longitud' => -99.51150000,
                'responsable' => [
                    'nombres' => 'Mariana',
                    'apellidos' => 'Ramos Cordero',
                    'documento_identidad' => 'RACM860405HJ9',
                    'telefono' => '442 229 3341',
                    'correo' => 'mariana.ramos@smurfitwestrock.com',
                    'cargo_nombre' => 'Coordinador de Logística y Cadena de Suministro',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Coordinador de Logística y Cadena de Suministro',
                        'descripcion' => 'Coordinación del patio de maniobras, flota de transporte terrestre y cumplimiento de entregas OTIF.',
                    ],
                    [
                        'nombre' => 'Supervisor de Embarques y Despacho',
                        'descripcion' => 'Inspección de carga en cajas secas, cubicaje de tarimas de cartón y emisión de cartas porte.',
                    ],
                    [
                        'nombre' => 'Operador de Montacargas con Clamp para Bobinas',
                        'descripcion' => 'Maniobra segura y descarga de bobinas pesadas de papel desde unidades y hacia corrugadora.',
                    ],
                    [
                        'nombre' => 'Analista de Control de Inventarios y Materia Prima',
                        'descripcion' => 'Conteos cíclicos, control de inventario en WMS de bobinas vírgenes, recicladas y pallets.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Fernando',
                        'apellidos' => 'Ortega Lozano',
                        'documento_identidad' => 'SW-MX-6001',
                        'curp_base' => 'OELF880119HQTNRR0',
                        'telefono' => '442 391 8201',
                        'correo' => 'fernando.ortega@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Supervisor de Embarques y Despacho',
                        'salario_diario' => 580.00,
                        'fecha_ingreso' => '2021-04-12',
                        'jornada_laboral' => ['tipo' => 'Turno Mixto', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Gustavo',
                        'apellidos' => 'Miranda Barajas',
                        'documento_identidad' => 'SW-MX-6002',
                        'curp_base' => 'MIBG930704HQTNDS0',
                        'telefono' => '442 419 2830',
                        'correo' => 'gustavo.miranda@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Operador de Montacargas con Clamp para Bobinas',
                        'salario_diario' => 500.00,
                        'fecha_ingreso' => '2022-09-05',
                        'jornada_laboral' => ['tipo' => 'Turno Rotativo 1', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']],
                    ],
                    [
                        'nombres' => 'Mónica',
                        'apellidos' => 'Belmonte Rangel',
                        'documento_identidad' => 'SW-MX-6003',
                        'curp_base' => 'BERM951030MQTLNM0',
                        'telefono' => '442 284 9102',
                        'correo' => 'monica.belmonte@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Analista de Control de Inventarios y Materia Prima',
                        'salario_diario' => 530.00,
                        'fecha_ingreso' => '2023-06-15',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-RRHH',
                'nombre' => 'Recursos Humanos y Relaciones Laborales',
                'descripcion' => 'Atracción de talento industrial, nóminas, clima laboral, desarrollo y relaciones sindicales.',
                'ubicacion' => 'Edificio Administrativo - Módulo RH',
                'piso' => 'Piso 2',
                'latitud' => 19.28480000,
                'longitud' => -99.51000000,
                'responsable' => [
                    'nombres' => 'Patricia',
                    'apellidos' => 'Morales Aguilar',
                    'documento_identidad' => 'MOAP801121JK2',
                    'telefono' => '55 5395 1122',
                    'correo' => 'patricia.morales@smurfitwestrock.com',
                    'cargo_nombre' => 'Gerente de Recursos Humanos Planta',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Gerente de Recursos Humanos Planta',
                        'descripcion' => 'Estrategia de capital humano, relación con sindicatos del papel y desarrollo organizacional.',
                    ],
                    [
                        'nombre' => 'Especialista en Nómina y Compensaciones',
                        'descripcion' => 'Cálculo de nómina semanal sindicalizada y quincenal administrativa, IMSS e INFONAVIT.',
                    ],
                    [
                        'nombre' => 'Coordinador de Atracción de Talento y Capacitación',
                        'descripcion' => 'Reclutamiento de perfiles técnicos de corrugado, flexografía y planes de capacitación continua.',
                    ],
                    [
                        'nombre' => 'Trabajador Social y Bienestar de Planta',
                        'descripcion' => 'Programas de apoyo a colaboradores, comedor industrial, transporte y bienestar integral.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Ana Sofía',
                        'apellidos' => 'Guzmán Peñaloza',
                        'documento_identidad' => 'SW-MX-7001',
                        'curp_base' => 'GUPA920317MDFZNN0',
                        'telefono' => '55 6192 8419',
                        'correo' => 'ana.guzman@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Especialista en Nómina y Compensaciones',
                        'salario_diario' => 620.00,
                        'fecha_ingreso' => '2021-03-01',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Mauricio',
                        'apellidos' => 'Velasco Trujillo',
                        'documento_identidad' => 'SW-MX-7002',
                        'curp_base' => 'VETM910808HDFLLR0',
                        'telefono' => '55 5410 2938',
                        'correo' => 'mauricio.velasco@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Coordinador de Atracción de Talento y Capacitación',
                        'salario_diario' => 590.00,
                        'fecha_ingreso' => '2022-05-16',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Karla Ivette',
                        'apellidos' => 'Campos Cedillo',
                        'documento_identidad' => 'SW-MX-7003',
                        'curp_base' => 'CACK960514MMCPDR0',
                        'telefono' => '722 519 2840',
                        'correo' => 'karla.campos@smurfitwestrock.com',
                        'genero' => 'F',
                        'cargo' => 'Trabajador Social y Bienestar de Planta',
                        'salario_diario' => 490.00,
                        'fecha_ingreso' => '2023-07-03',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
            [
                'codigo' => 'DEP-TIOT',
                'nombre' => 'Tecnologías de la Información y Automatización (TI/OT)',
                'descripcion' => 'Infraestructura de red de planta, ciberseguridad industrial, ERP y soporte de terminales de piso.',
                'ubicacion' => 'Centro de Datos e Infraestructura de Servidores',
                'piso' => 'Piso 1',
                'latitud' => 19.28460000,
                'longitud' => -99.51030000,
                'responsable' => [
                    'nombres' => 'Javier',
                    'apellidos' => 'Arredondo Luna',
                    'documento_identidad' => 'AELJ830219LK9',
                    'telefono' => '55 5658 9012',
                    'correo' => 'javier.arredondo@smurfitwestrock.com',
                    'cargo_nombre' => 'Coordinador de TI e Infraestructura',
                ],
                'cargos' => [
                    [
                        'nombre' => 'Coordinador de TI e Infraestructura',
                        'descripcion' => 'Dirección de infraestructura tecnológica, enlaces de comunicación satelital/fibra y políticas de ciberseguridad.',
                    ],
                    [
                        'nombre' => 'Administrador de Redes y Seguridad Informática',
                        'descripcion' => 'Gestión de firewalls, switches industriales, enlaces VPN entre plantas y control de acceso digital.',
                    ],
                    [
                        'nombre' => 'Ingeniero de Soporte Técnico y Sistemas de Planta',
                        'descripcion' => 'Soporte a básculas industriales, lectores RFID de andenes, terminales de montacargas y PCs.',
                    ],
                ],
                'colaboradores' => [
                    [
                        'nombres' => 'Sergio Iván',
                        'apellidos' => 'Godínez Ponce',
                        'documento_identidad' => 'SW-MX-8001',
                        'curp_base' => 'GOPS901211HDFDNG0',
                        'telefono' => '55 6920 1843',
                        'correo' => 'sergio.godinez@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Administrador de Redes y Seguridad Informática',
                        'salario_diario' => 690.00,
                        'fecha_ingreso' => '2021-09-01',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                    [
                        'nombres' => 'Daniel Alejandro',
                        'apellidos' => 'Becerril Rivas',
                        'documento_identidad' => 'SW-MX-8002',
                        'curp_base' => 'BERD950422HMCCCC0',
                        'telefono' => '722 481 0294',
                        'correo' => 'daniel.becerril@smurfitwestrock.com',
                        'genero' => 'M',
                        'cargo' => 'Ingeniero de Soporte Técnico y Sistemas de Planta',
                        'salario_diario' => 550.00,
                        'fecha_ingreso' => '2022-11-21',
                        'jornada_laboral' => ['tipo' => 'Tiempo Completo', 'dias' => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']],
                    ],
                ],
            ],
        ];

        DB::beginTransaction();

        try {
            $totalDepartamentos = 0;
            $totalCargos = 0;
            $totalResponsables = 0;
            $totalColaboradores = 0;

            foreach ($departamentosData as $deptoInfo) {
                // A. Crear o Actualizar Departamento
                $departamento = Departamento::updateOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'sucursal_id' => $sucursal->id,
                        'codigo' => $deptoInfo['codigo'],
                    ],
                    [
                        'nombre' => $deptoInfo['nombre'],
                        'descripcion' => $deptoInfo['descripcion'],
                        'ubicacion' => $deptoInfo['ubicacion'],
                        'piso' => $deptoInfo['piso'],
                        'user_id' => $user->id,
                        'status' => 1,
                        'latitud' => $deptoInfo['latitud'],
                        'longitud' => $deptoInfo['longitud'],
                    ]
                );
                $totalDepartamentos++;

                // B. Crear o Actualizar Cargos del Departamento
                $cargosMap = [];
                foreach ($deptoInfo['cargos'] as $cargoInfo) {
                    $cargo = Cargo::updateOrCreate(
                        [
                            'empresa_id' => $empresa->id,
                            'sucursal_id' => $sucursal->id,
                            'departamento_id' => $departamento->id,
                            'nombre' => $cargoInfo['nombre'],
                        ],
                        [
                            'descripcion' => $cargoInfo['descripcion'],
                            'user_id' => $user->id,
                            'status' => 1,
                        ]
                    );
                    $cargosMap[$cargoInfo['nombre']] = $cargo;
                    $totalCargos++;
                }

                // C. Crear o Actualizar Responsable del Departamento
                $respInfo = $deptoInfo['responsable'];
                $cargoResponsable = $cargosMap[$respInfo['cargo_nombre']] ?? null;

                $responsable = Responsable::updateOrCreate(
                    [
                        'empresa_id' => $empresa->id,
                        'sucursal_id' => $sucursal->id,
                        'correo' => $respInfo['correo'],
                    ],
                    [
                        'nombres' => $respInfo['nombres'],
                        'apellidos' => $respInfo['apellidos'],
                        'documento_identidad' => $respInfo['documento_identidad'],
                        'pais_telefono_id' => $paisMexico->id,
                        'telefono' => $respInfo['telefono'],
                        'departamento_id' => $departamento->id,
                        'cargo_id' => $cargoResponsable?->id,
                        'user_id' => $user->id,
                        'status' => 1,
                    ]
                );
                $totalResponsables++;

                // Actualizar el nombre del responsable en el departamento
                $departamento->update([
                    'responsable' => "{$responsable->nombres} {$responsable->apellidos}",
                ]);

                // D. Crear o Actualizar Colaboradores (Empleados) del Departamento
                foreach ($deptoInfo['colaboradores'] as $colabIndex => $colabInfo) {
                    $cargoColaborador = $cargosMap[$colabInfo['cargo']] ?? null;
                    $curpGenerada = $this->generateCurp($colabInfo['curp_base']);

                    // Si ya existe el empleado, mantener su código de acceso existente
                    $empleadoExistente = Empleado::where('documento_identidad', $colabInfo['documento_identidad'])->first();

                    $codigoAcceso = $empleadoExistente?->codigo_acceso;
                    if (empty($codigoAcceso)) {
                        $codigoAcceso = AccessCodeService::generate('empleado', $sucursal->id);
                    }

                    Empleado::updateOrCreate(
                        [
                            'documento_identidad' => $colabInfo['documento_identidad'],
                        ],
                        [
                            'nombres' => $colabInfo['nombres'],
                            'apellidos' => $colabInfo['apellidos'],
                            'codigo_acceso' => $codigoAcceso,
                            'tarjeta_acceso_1' => sprintf('TAG-SW-%04d', rand(1000, 9999)),
                            'curp' => $curpGenerada,
                            'pais_telefono_id' => $paisMexico->id,
                            'telefono' => $colabInfo['telefono'],
                            'correo' => $colabInfo['correo'],
                            'genero' => $colabInfo['genero'],
                            'departamento_id' => $departamento->id,
                            'responsable_id' => $responsable->id,
                            'cargo_id' => $cargoColaborador?->id,
                            'motivo_registro' => 'Contratación Directa - Operaciones Smurfit Westrock México',
                            'jornada_laboral' => $this->resolveJornadaLaboral($colabInfo['jornada_laboral'] ?? null),
                            'salario_diario' => $colabInfo['salario_diario'],
                            'fecha_ingreso' => $colabInfo['fecha_ingreso'],
                            'empresa_id' => $empresa->id,
                            'sucursal_id' => $sucursal->id,
                            'user_id' => $user->id,
                            'status' => true,
                        ]
                    );
                    $totalColaboradores++;
                }
            }

            DB::commit();

            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            $this->command->info('✅ SEEDER SMURFIT WESTROCK EJECUTADO CON ÉXITO');
            $this->command->info("🏢 Empresa: {$empresa->razon_social} (ID: {$empresa->id})");
            $this->command->info("📍 Sucursal: {$sucursal->nombre} (ID: {$sucursal->id})");
            $this->command->info("🇲🇽 País Teléfono: {$paisMexico->nombre} ({$paisMexico->codigo_telefonico})");
            $this->command->info("📂 Departamentos creados/actualizados: {$totalDepartamentos}");
            $this->command->info("💼 Cargos creados/actualizados: {$totalCargos}");
            $this->command->info("👤 Responsables creados/actualizados: {$totalResponsables}");
            $this->command->info("👷 Colaboradores creados/actualizados: {$totalColaboradores}");
            $this->command->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } catch (\Throwable $e) {
            DB::rollBack();
            $this->command->error("❌ Error al ejecutar SmurfitWestrockSeeder: {$e->getMessage()}");
            throw $e;
        }
    }

    /**
     * Calcula el dígito verificador oficial de RENAPO y retorna la CURP completa de 18 caracteres.
     */
    protected function generateCurp(string $base17): string
    {
        $base17 = strtoupper(trim($base17));

        if (strlen($base17) < 17) {
            $base17 = str_pad($base17, 17, '0');
        } elseif (strlen($base17) > 17) {
            $base17 = substr($base17, 0, 17);
        }

        $dictionary = '0123456789ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
        $sum = 0;

        for ($i = 0; $i < 17; $i++) {
            $char = $base17[$i];
            $pos = mb_strpos($dictionary, $char, 0, 'UTF-8');
            if ($pos === false) {
                $pos = 0;
            }
            $sum += $pos * (18 - $i);
        }

        $digit = (10 - ($sum % 10)) % 10;

        return $base17 . $digit;
    }

    /**
     * Resuelve y estandariza la jornada laboral en el formato de array de días esperado.
     */
    protected function resolveJornadaLaboral(mixed $jornada): array
    {
        if (is_array($jornada) && isset($jornada[0]['dia'])) {
            return $jornada;
        }

        $tipo = 'L-V';
        $ingreso = '08:00';
        $salida = '17:00';

        if (is_array($jornada) && isset($jornada['tipo'])) {
            if (str_contains($jornada['tipo'], 'Rotativo') || str_contains($jornada['tipo'], 'Mixto')) {
                $tipo = 'L-S';
                $ingreso = str_contains($jornada['tipo'], '2') ? '14:00' : '07:00';
                $salida = str_contains($jornada['tipo'], '2') ? '22:00' : '15:00';
            } elseif (str_contains($jornada['tipo'], 'Matutino')) {
                $ingreso = '07:00';
                $salida = '15:00';
            }
        }

        return $this->buildJornadaLaboral($tipo, $ingreso, $salida);
    }

    /**
     * Construye la estructura de jornada laboral por día esperada por el frontend.
     */
    protected function buildJornadaLaboral(string $tipo = 'L-V', string $ingreso = '08:00', string $salida = '17:00'): array
    {
        $dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        $jornada = [];

        foreach ($dias as $dia) {
            $activo = match ($tipo) {
                'L-V' => in_array($dia, ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']),
                'L-S' => in_array($dia, ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']),
                default => in_array($dia, ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']),
            };

            $jornada[] = [
                'dia' => $dia,
                'activo' => $activo,
                'hora_ingreso' => $activo ? $ingreso : '08:00',
                'hora_salida' => $activo ? $salida : '17:00',
            ];
        }

        return $jornada;
    }
}
