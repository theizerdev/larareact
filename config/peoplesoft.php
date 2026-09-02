<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Oracle PeopleSoft HCM — Time and Labor (interfaz TCD)
    |--------------------------------------------------------------------------
    |
    | Shigoto se presenta ante PeopleSoft como un TCD (Time Collection Device),
    | que es el rol que Time and Labor tiene previsto para relojes checadores
    | de terceros. Los marcajes que ya viven en `biotime_marcajes` (espejo de
    | ZKTeco BioTime) se traducen al layout TL_PUNCH_INTFC y se entregan a
    | Integration Broker con la operación de servicio PUNCHED_TIME_ADD.
    |
    | ------------------------------------------------------------------------
    | ESTADO: PREPARADO, NO ACTIVO.
    | ------------------------------------------------------------------------
    | Todavía no hay acceso a un PeopleSoft real. Mientras 'enabled' sea false
    | el cliente HTTP se niega a salir a la red: sólo se puede generar y revisar
    | el payload en modo simulación. Es deliberado — esta app corre en
    | producción y no queremos tráfico saliente accidental.
    |
    | Ver docs/peoplesoft-integracion.md para el detalle de la investigación.
    */

    // Interruptor maestro. Con false NO se abre ninguna conexión, pase lo que pase.
    'enabled' => (bool) env('PEOPLESOFT_ENABLED', false),

    // Con true se construye el payload y se registra, pero nunca se envía.
    // Se queda en true hasta que un envío real esté validado contra un entorno
    // de pruebas del cliente.
    'dry_run' => (bool) env('PEOPLESOFT_DRY_RUN', true),

    /*
    |--------------------------------------------------------------------------
    | Integration Broker
    |--------------------------------------------------------------------------
    | El gateway publica el listening connector en:
    |   http(s)://<host>/PSIGW/HttpListeningConnector
    | Los mensajes asíncronos se entregan por POST con el sobre <IBRequest>.
    */
    'gateway_url' => env('PEOPLESOFT_GATEWAY_URL'),

    // Nodo remitente (nuestro) y nodo destino (el local de PeopleSoft). Los da
    // el administrador de PeopleSoft al dar de alta el nodo del TCD.
    'node_from' => env('PEOPLESOFT_NODE_FROM', 'SHIGOTO_TCD'),
    'node_to' => env('PEOPLESOFT_NODE_TO'),

    // Contraseña del nodo, si el destino exige autenticación por password.
    'node_password' => env('PEOPLESOFT_NODE_PASSWORD'),

    // Basic auth a nivel HTTP, si el gateway está detrás de uno.
    'basic_auth_user' => env('PEOPLESOFT_BASIC_USER'),
    'basic_auth_password' => env('PEOPLESOFT_BASIC_PASSWORD'),

    // Operación de servicio para marcajes de reloj. Es la que Time and Labor
    // trae de fábrica en la cola PUNCHED_TIME.
    'operation_punched_time' => env('PEOPLESOFT_OP_PUNCHED_TIME', 'PUNCHED_TIME_ADD.VERSION_1'),

    'timeout' => (int) env('PEOPLESOFT_TIMEOUT', 30),
    'verify_ssl' => (bool) env('PEOPLESOFT_VERIFY_SSL', true),

    /*
    |--------------------------------------------------------------------------
    | Identidad del dispositivo
    |--------------------------------------------------------------------------
    | TL_PUNCH_INTFC.TCD_ID es Char(10) y lo define el cliente en
    | Set Up HCM > Time and Labor > Time Collection Devices.
    |
    | 'tcd_id_por_dispositivo' permite mapear el número de serie de cada reloj
    | SpeedFace a un TCD_ID distinto, si el cliente decide darlos de alta uno
    | por uno: ['SN-DEL-RELOJ' => 'TCD001']. Si un SN no está en la lista se
    | usa 'tcd_id_default'.
    */
    'tcd_id_default' => env('PEOPLESOFT_TCD_ID', 'SHIGOTO01'),
    'tcd_id_por_dispositivo' => [],

    // TL_PUNCH_INTFC.TIMEZONE es Char(9). PeopleSoft usa sus propios códigos
    // de zona horaria (tabla TIMEZONE), no los de IANA: CST/CDT, no
    // "America/Mexico_City". El valor correcto lo confirma el cliente.
    'timezone_code' => env('PEOPLESOFT_TIMEZONE_CODE', 'CST'),

    /*
    |--------------------------------------------------------------------------
    | Traducción de tipos de marcaje
    |--------------------------------------------------------------------------
    | Éste es el punto fino de toda la integración. ZKTeco y PeopleSoft no
    | modelan los punches igual:
    |
    |   ZKTeco punch_state            PeopleSoft PUNCH_TYPE
    |   0 Entrada                     1 In
    |   1 Salida                      2 Out
    |   2 Salida a descanso/comida    3 Meal  (o 4 Break)
    |   3 Regreso de descanso         1 In    <- ojo: en PeopleSoft el regreso
    |                                            de comida es un "In", no existe
    |                                            un "Meal In"
    |   4 Entrada horas extra         1 In
    |   5 Salida horas extra          2 Out
    |
    | El caso 2 es una decisión de negocio del cliente: si sus relojes se usan
    | para marcar comida, va a 3 (Meal); si se usan para pausas cortas, a 4
    | (Break). Se deja configurable en vez de asumirlo.
    |
    | Un punch_state que no esté en este mapa NO se exporta: se registra como
    | omitido con su motivo, en vez de inventar un tipo.
    */
    'punch_type_map' => [
        '0' => '1', // Entrada              -> In
        '1' => '2', // Salida               -> Out
        '2' => '3', // Salida a descanso    -> Meal
        '3' => '1', // Regreso de descanso  -> In
        '4' => '1', // Entrada horas extra  -> In
        '5' => '2', // Salida horas extra   -> Out
    ],

    /*
    |--------------------------------------------------------------------------
    | Lotes y ventanas
    |--------------------------------------------------------------------------
    */
    // Marcajes por mensaje PUNCHED_TIME_ADD. Time and Labor procesa el mensaje
    // completo con TL_ST_LOADER; lotes moderados hacen los errores más fáciles
    // de aislar en el TCD error queue.
    'batch_size' => (int) env('PEOPLESOFT_BATCH_SIZE', 250),

    // Ventana por defecto (horas hacia atrás) cuando no se pasa --desde/--hasta.
    'window_hours' => (int) env('PEOPLESOFT_WINDOW_HOURS', 24),

    // Filas por transacción de BD al registrar el outbox (SQLite: locks cortos).
    'db_chunk' => (int) env('PEOPLESOFT_DB_CHUNK', 200),
];
