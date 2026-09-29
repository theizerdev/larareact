<?php

return [
    // DIDIT expone la API de verificación unificada en verification.didit.me
    // y el portal hospedado de verificación para usuarios en verify.didit.me.
    'base_url' => env('DIDIT_BASE_URL', 'https://verification.didit.me'),
    'hosted_url' => env('DIDIT_HOSTED_URL', 'https://verify.didit.me'),

    // Timeouts de conexión y lectura
    'timeout' => (int) env('DIDIT_TIMEOUT', 15),
    'connect_timeout' => (int) env('DIDIT_CONNECT_TIMEOUT', 5),

    // Kill-switch global (además del didit_active por empresa).
    'enabled' => env('DIDIT_ENABLED', true),

    // Workflow ID predeterminado (Custom KYC en la cuenta)
    'default_workflow_id' => env('DIDIT_DEFAULT_WORKFLOW_ID', 'd7fe3736-3de9-4bb7-8b63-4bd53f8de50a'),
];
