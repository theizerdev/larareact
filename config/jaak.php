<?php

return [
    // JAAK expone dos ambientes totalmente separados con credenciales propias:
    // una App Key de sandbox contra la URL de producción (o viceversa) responde 401.
    // El ambiente activo se elige por empresa (empresas.jaak_environment); estas
    // son sólo las dos URLs base fijas de cada ambiente.
    'sandbox_url' => env('JAAK_SANDBOX_URL', 'https://api.sandbox.jaak.ai'),
    'production_url' => env('JAAK_PRODUCTION_URL', 'https://services.api.jaak.ai'),
    'timeout' => env('JAAK_TIMEOUT', 15),

    // Presupuesto total (segundos) del flujo KYC cuando corre inline con
    // ->afterResponse(): al superarlo se saltan los pasos opcionales que falten
    // y la validación queda en 'revision'. Protege a los workers de Apache en
    // el host compartido si JAAK se pone lento.
    'kyc_time_budget' => (int) env('JAAK_KYC_TIME_BUDGET', 120),

    // Kill-switch global del KYC (además del jaak_active por empresa). Ponlo en
    // false para dejar de disparar validaciones sin tocar la config de cada empresa.
    'kyc_enabled' => env('JAAK_KYC_ENABLED', true),

    // Umbral de similitud facial (paso 8 - One To One). JAAK devuelve el score
    // en escala 0..100; el prioritario es state.isSamePerson.
    'face_match_threshold' => (float) env('JAAK_FACE_MATCH_THRESHOLD', 60),

    // País por defecto del documento (ISO alpha-3) cuando no se puede derivar.
    'default_country' => env('JAAK_DEFAULT_COUNTRY', 'MEX'),
];
