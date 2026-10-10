<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Módulos habilitados en esta instancia
    |--------------------------------------------------------------------------
    |
    | Esta rama es la instancia de Smurfit Westrock: sólo opera el Reloj
    | Checador. Un módulo apagado no se oculta nada más del menú: sus rutas
    | responden 404 (middleware `modulo:<clave>`), así que tampoco se alcanza
    | escribiendo la URL. Se prende por .env si algún día se contrata.
    |
    */

    // Socios comerciales (antes "Productores"): altas, pre-registro y carnets.
    'productores' => (bool) env('MODULO_PRODUCTORES', false),

    // Control de acceso con Hikvision iVMS: empleados, tarjetas, eventos.
    'control_acceso' => (bool) env('MODULO_CONTROL_ACCESO', false),

    // Validaciones de identidad y firma (JAAK, ZapSign, Didit) y sus resultados.
    'validaciones' => (bool) env('MODULO_VALIDACIONES', false),

    // Landing comercial de Hoshō en "/" (muestra otros clientes y socios).
    'landing' => (bool) env('MODULO_LANDING', false),
];
