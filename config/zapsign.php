<?php

return [
    // ZapSign expone dos ambientes totalmente separados, cada uno con su propio
    // API Token: un token de producción contra la URL de sandbox (o viceversa)
    // responde 403 "API token not found". El ambiente activo se elige por
    // empresa (empresas.zapsign_environment); aquí sólo viven las dos URLs base.
    'sandbox_url' => env('ZAPSIGN_SANDBOX_URL', 'https://sandbox.api.zapsign.com.br'),
    'production_url' => env('ZAPSIGN_PRODUCTION_URL', 'https://api.zapsign.com.br'),

    // Timeouts cortos a propósito: el job KYC de JAAK ya corre inline con
    // ->afterResponse() y los workers de Apache son un recurso escaso en el
    // host compartido. ZapSign nunca debe dejar colgado un worker.
    'timeout' => (int) env('ZAPSIGN_TIMEOUT', 15),
    'connect_timeout' => (int) env('ZAPSIGN_CONNECT_TIMEOUT', 5),

    // Kill-switch global (además del zapsign_active por empresa). Ponlo en
    // false para cortar todo el tráfico a ZapSign sin tocar la config de las
    // empresas ni desplegar código.
    'enabled' => env('ZAPSIGN_ENABLED', true),

    // Límite global publicado por ZapSign: 500 req/min por token o IP. Se usa
    // sólo para redactar el mensaje de error del HTTP 429.
    'rate_limit_per_minute' => (int) env('ZAPSIGN_RATE_LIMIT', 500),
];
