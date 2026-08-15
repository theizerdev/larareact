<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Services\AccessCodeService;
use App\Models\Sucursal;

echo "====================================================\n";
echo " PRUEBA DE GENERADOR DE CÓDIGO DE ACCESO (8 DÍGITOS)\n";
echo "====================================================\n\n";

$sucursal = Sucursal::first();
$sucursalId = $sucursal ? $sucursal->id : null;
$sucursalNombre = $sucursal ? $sucursal->nombre : 'Default (Purépero)';

echo "Sucursal de Prueba: {$sucursalNombre} (ID: {$sucursalId})\n";
echo "Numeral 1 de Sucursal: " . AccessCodeService::resolveNumeral1($sucursalId) . "\n\n";

$codeEmpleado   = AccessCodeService::generate('empleado', $sucursalId, 0);
$codeProductor  = AccessCodeService::generate('productor', $sucursalId, 0);
$codeProveedor  = AccessCodeService::generate('proveedor', $sucursalId, 0);
$codeVisitante  = AccessCodeService::generate('visitante', $sucursalId, 0);
$codeVisitanteVip = AccessCodeService::generate('visitante', $sucursalId, 1);

echo "1. Empleado (Rol 1, Normal):   {$codeEmpleado}\n";
echo "2. Productor (Rol 3, Normal):  {$codeProductor}\n";
echo "3. Proveedor (Rol 5, Normal):  {$codeProveedor}\n";
echo "4. Visitante (Rol 8, Normal):  {$codeVisitante}\n";
echo "5. Visitante (Rol 8, VIP):     {$codeVisitanteVip}\n";
echo "\n====================================================\n";
