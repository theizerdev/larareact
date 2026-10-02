<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\EmpleadoImportService;

echo "====================================================\n";
echo " TEST EXCEL HEADER ROBUSTNESS\n";
echo "====================================================\n\n";

$headersToTest = [
    'No. Empleado',
    'No. de Empleado',
    'Número de Empleado',
    'N° Empleado',
    'Nº Empleado',
    'COD. EMPLEADO',
    'No.  Empleado',
    'No.Empleado',
    'No_Empleado',
    'NUM EMPLEADO',
    'No Empleado',
    'ID EMPLEADO',
];

$service = new EmpleadoImportService();

$reflection = new ReflectionClass($service);
$method = $reflection->getMethod('resolveColumnMap');
$method->setAccessible(true);

foreach ($headersToTest as $hText) {
    $map = $method->invoke($service, ['H' => $hText]);
    $matched = isset($map['documento_identidad']) && $map['documento_identidad'] === 'H';
    $status = $matched ? "✓ MATCHED" : "❌ FAILED";
    echo sprintf("%-30s -> %s\n", "'{$hText}'", $status);
}

echo "\n====================================================\n";
