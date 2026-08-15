<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;

echo "====================================================\n";
echo " PRUEBA DE BÚSQUEDA DE KIOSKO RELOJ CHECADOR\n";
echo "====================================================\n\n";

$empleado = Empleado::whereNotNull('codigo_acceso')->first();

if (!$empleado) {
    echo "No hay empleados con codigo_acceso para probar.\n";
    exit(0);
}

echo "Empleado de prueba: {$empleado->nombre_completo}\n";
echo "Código de Acceso (8D): {$empleado->codigo_acceso}\n";
echo "Documento Identidad:   {$empleado->documento_identidad}\n\n";

$testQueries = [
    $empleado->codigo_acceso,                       // 8 dígitos exactos (ej. 10100001)
    ltrim($empleado->codigo_acceso, '0'),           // Sin cero inicial (ej. 7 dígitos 1010001)
    $empleado->documento_identidad,                 // Documento identidad (6 dígitos)
    (string)$empleado->id,                           // ID numérico
];

foreach ($testQueries as $q) {
    $req = \Illuminate\Http\Request::create('/admin/api/reloj-checador/buscar', 'POST', ['query' => $q]);
    $controller = new \App\Http\Controllers\Admin\RelojChecadorKioskoController();
    $res = $controller->buscarEmpleado($req);
    $data = json_decode($res->getContent(), true);

    if ($data && !empty($data['success'])) {
        echo "✓ Búsqueda por '{$q}' -> Encontrado: {$data['empleado']['nombre_completo']} [CÓD: {$data['empleado']['codigo_acceso']}]\n";
    } else {
        echo "❌ Búsqueda por '{$q}' -> No encontrado\n";
    }
}

echo "\n====================================================\n";
