<?php

use Illuminate\Support\Facades\Route;

// Archivos de rutas que pertenecen a un módulo apagable (config/modulos.php).
// Se registran igual, para que los nombres de ruta existan, pero detrás del
// middleware `modulo:` que responde 404 cuando el módulo está apagado.
$modulosPorArchivo = [
    'productores.php' => 'productores',
    'control-acceso.php' => 'control_acceso',
    'validaciones.php' => 'validaciones',
];

// Obtener todos los archivos PHP dentro de la carpeta modules
$modulesFiles = glob(__DIR__.'/modules/*.php');

foreach ($modulesFiles as $file) {
    $modulo = $modulosPorArchivo[basename($file)] ?? null;

    if ($modulo) {
        Route::middleware("modulo:{$modulo}")->group($file);
    } else {
        require $file;
    }
}
