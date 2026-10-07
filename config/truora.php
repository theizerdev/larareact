<?php

return [
    // API de Background Checks (antecedentes) de Truora.
    'base_url' => env('TRUORA_BASE_URL', 'https://api.checks.truora.com'),

    // Timeouts de conexión y lectura
    'timeout' => (int) env('TRUORA_TIMEOUT', 20),
    'connect_timeout' => (int) env('TRUORA_CONNECT_TIMEOUT', 5),

    // Kill-switch global (además del truora_active por empresa).
    'enabled' => env('TRUORA_ENABLED', true),

    // Score mínimo (0 a 1; 1 = máxima confianza) para dar por aprobada la
    // verificación de antecedentes si la empresa no define uno propio.
    'score_minimo' => (float) env('TRUORA_SCORE_MINIMO', 0.8),
];
