<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CONTPAQi Nóminas (NOMIPAQ) — exportación de prenómina
    |--------------------------------------------------------------------------
    |
    | Shigoto no escribe en CONTPAQi: le entrega un archivo de Excel con el
    | layout que la prenómina acepta desde "Capturar movimientos desde Excel".
    | Es la puerta que el propio CONTPAQi publica para cargar movimientos, así
    | que no hace falta SDK con licencia ni tocar su base de datos Firebird.
    |
    | El flujo completo es:
    |
    |   marcajes -> asistencia_resumenes_diarios -> incidencias derivadas
    |                                             + incidencias capturadas
    |                                             -> renglones de prenómina
    |                                             -> archivo .xlsx
    |
    | Ver docs/contpaqi-integracion.md para el detalle del diseño.
    |
    | ------------------------------------------------------------------------
    | ESTADO: el layout de columnas todavía NO está confirmado contra un
    | CONTPAQi real.
    | ------------------------------------------------------------------------
    | Los valores de 'layout' de abajo son un default razonable, no una
    | verdad verificada. La plantilla buena la produce el propio CONTPAQi con
    | el botón "Hoja de trabajo" de la prenómina; en cuanto exista ese archivo
    | hay que cotejar 'layout' contra él. Mientras tanto la exportación
    | funciona y es revisable, pero conviene probar la importación con un
    | período de prueba antes de usarla en una nómina real.
    */

    // Interruptor maestro del módulo. Con false no se genera ningún archivo.
    'enabled' => (bool) env('CONTPAQI_ENABLED', true),

    /*
    | Con false, el panel muestra un aviso de que el layout no está verificado.
    |
    | Está en true por indicación del cliente (sept. 2026): los encabezados del
    | archivo son los mnemónicos de su propio catálogo —HE1, TRAB, RET…—, que
    | es justo lo que 'encabezado_por_mnemonico' produce por default.
    |
    | Conviene tener claro qué respalda ese true: es la palabra del cliente
    | sobre su catálogo, no una importación de prueba que haya funcionado. La
    | primera vez sigue siendo buena idea correr un período de ensayo antes de
    | una nómina real.
    */
    'layout_confirmado' => (bool) env('CONTPAQI_LAYOUT_CONFIRMADO', true),

    /*
    |--------------------------------------------------------------------------
    | Período de nómina
    |--------------------------------------------------------------------------
    | El cliente de referencia (Frigorífico Santander) trae período semanal de
    | lunes a domingo — en el screenshot de su CONTPAQi: "15 - Semanal del
    | lunes, 6 de abril de 2026 al domingo, 12 de abril de 2026".
    |
    | 'dia_inicio_semana' es ISO-8601: 1 = lunes ... 7 = domingo.
    */
    'periodicidad' => env('CONTPAQI_PERIODICIDAD', 'semanal'),
    'dia_inicio_semana' => (int) env('CONTPAQI_DIA_INICIO_SEMANA', 1),

    /*
    |--------------------------------------------------------------------------
    | Layout del archivo de prenómina
    |--------------------------------------------------------------------------
    | CONTPAQi lee una hoja donde cada renglón es un empleado y cada columna a
    | partir de la primera es un tipo de incidencia. La primera columna es
    | siempre el código del empleado tal como existe en CONTPAQi (el "Código
    | empleado" de la prenómina), no el id interno de Shigoto.
    |
    | 'fila_encabezado' es 1-indexado y 'primera_fila_datos' también.
    */
    'layout' => [
        'nombre_hoja' => env('CONTPAQI_HOJA', 'Movimientos'),
        'fila_encabezado' => 1,
        'primera_fila_datos' => 2,

        // Columnas fijas del inicio del renglón. El orden importa: es el orden
        // en que se escriben. 'clave' es interna, 'titulo' es lo que se ve.
        'columnas_fijas' => [
            ['clave' => 'codigo_empleado', 'titulo' => 'Código empleado'],
            ['clave' => 'nombre_empleado', 'titulo' => 'Nombre empleado'],
        ],

        // Con true, el encabezado de cada columna de incidencia es el
        // mnemónico (HE1, TRAB, RET...). Con false se usa el número de
        // concepto de CONTPAQi. Cuál de los dos espera la importación es
        // justamente lo que hay que confirmar con la "Hoja de trabajo".
        'encabezado_por_mnemonico' => (bool) env('CONTPAQI_ENCABEZADO_MNEMONICO', true),

        // Incluir columnas de incidencias que quedaron en cero para todos los
        // empleados del período. En false el archivo sale más corto y legible.
        'incluir_columnas_vacias' => false,

        // Decimales para incidencias medidas en horas y en días.
        'decimales_horas' => 2,
        'decimales_dias' => 2,
    ],

    /*
    |--------------------------------------------------------------------------
    | Derivación de incidencias desde la asistencia
    |--------------------------------------------------------------------------
    | Éste es el punto fino del módulo, igual que el punch_type_map lo era en
    | PeopleSoft. Traduce lo que Shigoto calcula a los mnemónicos del catálogo
    | del cliente. Un mnemónico en null desactiva esa derivación en vez de
    | inventar un destino.
    |
    | OJO con las horas extra: el catálogo del cliente trae HE1..HE5 y su
    | significado exacto lo define el cliente en CONTPAQi, no la LFT. Shigoto
    | calcula la regla 3x3 (dobles hasta 9 h semanales, triples el excedente),
    | así que por default manda dobles a HE1 y triples a HE2. Si en su
    | CONTPAQi HE1..HE5 significan otra cosa, se corrige aquí y en ningún
    | otro lado.
    */
    'derivacion' => [
        // Días con horas ordinarias > 0.
        'dias_trabajados' => 'TRAB',

        // Regla 3x3 LFT (arts. 66-68).
        'horas_extra_dobles' => 'HE1',
        'horas_extra_triples' => 'HE2',

        // minutos_retraso acumulados del período, convertidos a horas.
        'retardos' => 'RET',

        // Día festivo trabajado. Se separa en obligatorio (es_oficial_lft) y
        // no obligatorio, porque el catálogo del cliente los distingue.
        'festivo_trabajado' => 'DFT',
        'descanso_obligatorio_laborado' => 'DDOL',

        // Día de descanso semanal en el que sí hubo trabajo.
        'descanso_laborado' => 'DDL',

        // Día laborable sin marcajes y sin incidencia capturada que lo cubra.
        'falta_injustificada' => 'FINJ',
    ],

    /*
    |--------------------------------------------------------------------------
    | Faltas
    |--------------------------------------------------------------------------
    | Marcar una falta injustificada tiene consecuencias de dinero (descuenta
    | proporción de séptimo día), así que el default es conservador: sólo se
    | deriva FINJ cuando el día era laborable según el turno, no hubo ningún
    | marcaje y ninguna incidencia capturada cubre esa fecha.
    |
    | Con 'derivar_faltas' en false, las faltas nunca se derivan solas y
    | tienen que capturarse a mano como cualquier otra incidencia.
    */
    'derivar_faltas' => (bool) env('CONTPAQI_DERIVAR_FALTAS', true),

    /*
    |--------------------------------------------------------------------------
    | Almacenamiento de los archivos generados
    |--------------------------------------------------------------------------
    */
    'disco' => env('CONTPAQI_DISCO', 'local'),
    'directorio' => env('CONTPAQI_DIRECTORIO', 'contpaqi/prenomina'),

    /*
    |--------------------------------------------------------------------------
    | Catálogo de referencia
    |--------------------------------------------------------------------------
    | Fuente: "CATALOGO DE INCIDENCIAS NOMIPAQ - FRIGORIFICO" del 07/Abr/2026,
    | exportado del propio CONTPAQi del cliente.
    |
    | Esto es solo la semilla para poblar contpaqi_tipos_incidencia la primera
    | vez. La verdad operativa vive en la base de datos y es editable por
    | empresa, porque cada cliente arma su catálogo distinto.
    |
    | unidad:   dias | horas   (cómo se captura la cantidad)
    | tipo_imss: null cuando el catálogo lo trae vacío
    */
    'catalogo_semilla' => [
        ['mnemonico' => 'HE1',  'descripcion' => 'Horas extras 1',                        'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'HE2',  'descripcion' => 'Horas extras 2',                        'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'HE3',  'descripcion' => 'Horas extras 3',                        'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'HE4',  'descripcion' => 'Horas extras 4',                        'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'HE5',  'descripcion' => 'Horas extras 5',                        'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'TRAB', 'descripcion' => 'Días trabajados',                       'unidad' => 'dias',  'tipo_imss' => null,          'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
        ['mnemonico' => 'PCS',  'descripcion' => 'Permisos con goce de sueldo',           'unidad' => 'dias',  'tipo_imss' => null,          'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
        ['mnemonico' => 'PSS',  'descripcion' => 'Permisos sin goce de sueldo',           'unidad' => 'dias',  'tipo_imss' => 'Ausencia',    'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => true],
        ['mnemonico' => 'ATRB', 'descripcion' => 'Accidente de trabajo',                  'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'ATRY', 'descripcion' => 'Accidente de trayecto',                 'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'ENFG', 'descripcion' => 'Enf. Gral./Acc. Fuera trab.',           'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => true],
        ['mnemonico' => 'INC',  'descripcion' => 'Incapacidad pagada por la empresa',     'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'MAT',  'descripcion' => 'Incapacidad por maternidad',            'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'VAC',  'descripcion' => 'Vacaciones a pagar',                    'unidad' => 'dias',  'tipo_imss' => 'Vacaciones',  'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'FINJ', 'descripcion' => 'Faltas injustificadas',                 'unidad' => 'dias',  'tipo_imss' => 'Ausencia',    'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => true],
        ['mnemonico' => 'CAST', 'descripcion' => 'Días de castigo',                       'unidad' => 'dias',  'tipo_imss' => 'Ausencia',    'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => true],
        ['mnemonico' => 'RET',  'descripcion' => 'Retardos',                              'unidad' => 'horas', 'tipo_imss' => null,          'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
        ['mnemonico' => 'L140', 'descripcion' => 'Licencia 140 Bis',                      'unidad' => 'dias',  'tipo_imss' => 'Incapacidad', 'derecho_sueldo' => false, 'porcentaje_derecho' => 0,   'descuenta_septimo' => false],
        ['mnemonico' => 'DFT',  'descripcion' => 'Día festivo trabajado',                 'unidad' => 'dias',  'tipo_imss' => null,          'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
        ['mnemonico' => 'DDL',  'descripcion' => 'Días de descanso laborados',            'unidad' => 'dias',  'tipo_imss' => null,          'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
        ['mnemonico' => 'DDOL', 'descripcion' => 'Días de descanso obligatorios laborados', 'unidad' => 'dias', 'tipo_imss' => null,         'derecho_sueldo' => true,  'porcentaje_derecho' => 100, 'descuenta_septimo' => false],
    ],

    /*
    |--------------------------------------------------------------------------
    | Equivalencia mnemónico de incidencia -> número de concepto
    |--------------------------------------------------------------------------
    | Rellena el campo concepto_nomipaq del catálogo.
    |
    | IMPORTANTE: hoy esto es informativo, no cambia el archivo que se genera.
    | Con 'encabezado_por_mnemonico' en true —que es como está— los encabezados
    | del Excel son los mnemónicos, no estos números. Sirve para trazabilidad:
    | poder mirar el catálogo de Shigoto y saber contra qué concepto de
    | CONTPAQi cae cada incidencia, sin abrir CONTPAQi.
    |
    | De dónde salen: del "Catálogo de conceptos" del cliente. Ese listado está
    | ordenado alfabéticamente y la captura de pantalla lo corta en la letra H,
    | así que sólo se conocen los conceptos de la A a la H. Todo lo que en el
    | catálogo de CONTPAQi empiece con I o más adelante —incapacidades,
    | permisos, retardos, faltas— no se ha visto y por eso queda en null.
    |
    | Un null NO rompe nada: significa "todavía no se sabe", que es información
    | verdadera. Inventar un número sería peor que dejarlo vacío.
    */
    'conceptos_por_mnemonico' => [
        // Coincidencias literales con el catálogo de conceptos del cliente.
        'DDL' => 54,   // Días de descanso laborados
        'DDOL' => 55,  // Días de descanso obligatorios
        'VAC' => 23,   // Días de vacaciones
        'DFT' => 11,   // Día festivo / descanso

        /*
         * El catálogo del cliente tiene DOS conceptos de horas extra casi
         * homónimos: "4 Horas extras" y "135 Horas Extras." (con punto). Se
         * elige el 4 por ser el de numeración baja, que en CONTPAQi
         * corresponde a los conceptos de sistema, mientras que los de tres
         * dígitos suelen ser altas del propio cliente.
         *
         * Es una inferencia, no un dato confirmado. Si en su instalación las
         * horas extra se capturan contra el 135, se cambia aquí.
         */
        'HE1' => 4,
        'HE2' => 4,
        'HE3' => 4,
        'HE4' => 4,
        'HE5' => 4,

        // Sin equivalencia conocida: su concepto cae fuera del tramo A-H que
        // alcanza a verse en el catálogo del cliente.
        'TRAB' => null,
        'RET' => null,
        'FINJ' => null,
        'PCS' => null,
        'PSS' => null,
        'ATRB' => null,
        'ATRY' => null,
        'ENFG' => null,
        'INC' => null,
        'MAT' => null,
        'CAST' => null,
        'L140' => null,
    ],

    /*
    |--------------------------------------------------------------------------
    | Conceptos de CONTPAQi vistos en el catálogo del cliente
    |--------------------------------------------------------------------------
    | Del screenshot de "Catálogo de conceptos" y de la hoja de percepciones
    | del Excel. Sirven para prellenar el campo concepto_nomipaq del catálogo
    | de incidencias; no todos aplican a una prenómina de asistencia.
    |
    | No están todos: el screenshot muestra la lista cortada. Completar contra
    | el CONTPAQi del cliente cuando haga falta.
    */
    'conceptos_conocidos' => [
        4 => 'Horas extras',
        5 => 'Destajos',
        6 => 'Comisiones',
        11 => 'Día festivo / descanso',
        12 => 'Gratificación',
        13 => 'Compensación',
        17 => 'Ajuste en sueldos',
        18 => 'Anticipo de sueldos',
        20 => 'Prima Vacacional',
        23 => 'Días de vacaciones',
        24 => 'Aguinaldo',
        31 => 'Fondo ahorro empresa',
        32 => 'Despensa',
        33 => 'Deporte y cultura',
        35 => 'Anticipo vacaciones',
        36 => 'Destajo - sueldo',
        37 => 'Comisión sueldo',
        54 => 'Días de descanso laborados',
        55 => 'Días de descanso obligatorios',
        132 => 'Bono por Asistencia',
        133 => 'Bono por Puntualidad',
        134 => 'Bono por viajes',
        135 => 'Horas Extras.',
    ],
];
