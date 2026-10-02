<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\EmpleadoImportService;

echo "====================================================\n";
echo " PRUEBA DE MAPEO DE CABECERA EXCEL 'No.empleado'\n";
echo "====================================================\n\n";

$service = new EmpleadoImportService();

$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('resolveColumnMap');
$method->setAccessible(true);

$testHeaders = [
    ['A' => 'No.empleado', 'B' => 'Nombres', 'C' => 'Apellido Paterno'],
    ['A' => 'no. empleado', 'B' => 'Nombres', 'C' => 'Apellido Paterno'],
    ['A' => 'NUMERO EMPLEADO', 'B' => 'Nombres', 'C' => 'Apellido Paterno'],
    ['A' => 'Código de Empleado', 'B' => 'Nombres', 'C' => 'Apellido Paterno'],
];

foreach ($testHeaders as $index => $headers) {
    $map = $method->invoke($service, $headers);
    echo "Prueba #" . ($index + 1) . ": Cabecera '{$headers['A']}' -> Mapeado a 'documento_identidad': Column " . ($map['documento_identidad'] ?? 'NULL') . "\n";
}

echo "\n====================================================\n";
