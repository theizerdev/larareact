<?php

/*
| Solo se fija lo que difiere del valor por defecto del paquete; el resto
| (stateful, guard, prefix...) lo completa Sanctum con su propia config.
*/
return [
    // Minutos de vida de los tokens de la app móvil. Antes no caducaban nunca,
    // ni siquiera los emitidos con el número de empleado (sin contraseña).
    // Al caducar la app recibe 401 y vuelve a pedir el acceso.
    'expiration' => (int) env('SANCTUM_EXPIRATION', 60 * 24 * 30),
];
