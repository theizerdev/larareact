<?php

use Illuminate\Support\Facades\Route;

// Obtener todos los archivos PHP dentro de la carpeta modules
$modulesFiles = glob(__DIR__ . '/modules/*.php');

foreach ($modulesFiles as $file) {
    require_once $file;
}
