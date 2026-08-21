<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;
use App\Models\Proveedor;
use App\Models\Productor;
use App\Services\AccessCodeService;

echo "====================================================\n";
echo " ASIGNACIÓN DE CÓDIGOS DE ACCESO A REGISTROS PREVIOS\n";
echo "====================================================\n\n";

$countEmpleados = 0;
Empleado::whereNull('codigo_acceso')->orWhere('codigo_acceso', '')->chunk(50, function ($empleados) use (&$countEmpleados) {
    foreach ($empleados as $emp) {
        $emp->codigo_acceso = AccessCodeService::generate('empleado', $emp->sucursal_id);
        $emp->save();
        $countEmpleados++;
    }
});
echo "✓ Empleados actualizados con código de acceso: {$countEmpleados}\n";

$countProveedores = 0;
Proveedor::whereNull('codigo_acceso')->orWhere('codigo_acceso', '')->chunk(50, function ($proveedores) use (&$countProveedores) {
    foreach ($proveedores as $prov) {
        $prov->codigo_acceso = AccessCodeService::generate('proveedor', $prov->sucursal_id);
        $prov->save();
        $countProveedores++;
    }
});
echo "✓ Proveedores actualizados con código de acceso: {$countProveedores}\n";

$countProductores = 0;
Productor::whereNull('codigo_acceso')->orWhere('codigo_acceso', '')->chunk(50, function ($productores) use (&$countProductores) {
    foreach ($productores as $prod) {
        $prod->codigo_acceso = AccessCodeService::generate('productor', $prod->sucursal_id);
        $prod->save();
        $countProductores++;
    }
});
echo "✓ Productores actualizados con código de acceso: {$countProductores}\n";

echo "\n====================================================\n";
