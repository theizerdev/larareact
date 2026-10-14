<?php

return [
    'api_url' => env('WHATSAPP_API_URL', 'http://82.165.213.124:8092'),
    // Los nombres originales traían errata (WHATSATP_ / WHATSAPL_) y por eso la
    // variable bien escrita nunca se leía. Se lee la correcta y, por
    // compatibilidad, la antigua.
    'api_key' => env('WHATSAPP_API_KEY', env('WHATSATP_API_KEY', 'test-api-key-vargas-centro')),
    'jwt_secret' => env('WHATSAPP_JWT_SECRET', env('WHATSAPL_JWT_SECRET', 'test-api-key-vargas-centro')),
    'timeout' => env('WHATSAPP_TIMEOUT', 30),
];
