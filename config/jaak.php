<?php

return [
    // JAAK expone dos ambientes totalmente separados con credenciales propias:
    // una App Key de sandbox contra la URL de producción (o viceversa) responde 401.
    // El ambiente activo se elige por empresa (empresas.jaak_environment); estas
    // son sólo las dos URLs base fijas de cada ambiente.
    'sandbox_url' => env('JAAK_SANDBOX_URL', 'https://api.sandbox.jaak.ai'),
    'production_url' => env('JAAK_PRODUCTION_URL', 'https://services.api.jaak.ai'),
    'timeout' => env('JAAK_TIMEOUT', 15),
];
