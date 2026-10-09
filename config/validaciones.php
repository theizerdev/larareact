<?php

return [
    // Validaciones automáticas al registrar (altas del panel y pre-registros).
    // Apagadas: para controlar el costo de las APIs, toda validación la elige el
    // usuario (botones del formulario o menú Validar ▸). En true se vuelve al
    // comportamiento anterior: cada alta valida según la regla de la empresa.
    'automaticas' => (bool) env('VALIDACIONES_AUTOMATICAS', false),
];
