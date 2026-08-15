<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;
use App\Models\Proveedor;
use App\Models\Productor;
use App\Models\VisitaAcceso;

echo "====================================================\n";
echo " PRUEBA DE ASIGNACIÓN DE CÓDIGO VISITANTE EN ACCESOS\n";
echo "====================================================\n\n";

$empleado = Empleado::whereNotNull('codigo_acceso')->first();
$proveedor = Proveedor::whereNotNull('codigo_acceso')->first();
$productor = Productor::whereNotNull('codigo_acceso')->first();

if ($empleado) {
    $accesoEmp = VisitaAcceso::create([
        'tipo_acceso' => 'empleado',
        'empleado_id' => $empleado->id,
        'medio_acceso' => 'peatonal',
        'fecha_ingreso' => now()->toDateString(),
        'hora_ingreso' => now()->toTimeString(),
        'empresa_id' => $empleado->empresa_id ?? 1,
        'sucursal_id' => $empleado->sucursal_id ?? 1,
        'status' => 1,
    ]);
    echo "✓ Empleado '{$empleado->nombre_completo}' (Código Acceso: {$empleado->codigo_acceso})\n";
    echo "  -> Creado VisitaAcceso ID #{$accesoEmp->id} con codigo_visitante: {$accesoEmp->codigo_visitante}\n\n";
    $accesoEmp->delete();
}

if ($proveedor) {
    $accesoProv = VisitaAcceso::create([
        'tipo_acceso' => 'proveedor',
        'proveedor_id' => $proveedor->id,
        'medio_acceso' => 'peatonal',
        'fecha_ingreso' => now()->toDateString(),
        'hora_ingreso' => now()->toTimeString(),
        'empresa_id' => $proveedor->empresa_id ?? 1,
        'sucursal_id' => $proveedor->sucursal_id ?? 1,
        'status' => 1,
    ]);
    echo "✓ Proveedor '{$proveedor->razon_social}' (Código Acceso: {$proveedor->codigo_acceso})\n";
    echo "  -> Creado VisitaAcceso ID #{$accesoProv->id} con codigo_visitante: {$accesoProv->codigo_visitante}\n\n";
    $accesoProv->delete();
}

if ($productor) {
    $accesoProd = VisitaAcceso::create([
        'tipo_acceso' => 'productor',
        'productor_id' => $productor->id,
        'medio_acceso' => 'peatonal',
        'fecha_ingreso' => now()->toDateString(),
        'hora_ingreso' => now()->toTimeString(),
        'empresa_id' => $productor->empresa_id ?? 1,
        'sucursal_id' => $productor->sucursal_id ?? 1,
        'status' => 1,
    ]);
    echo "✓ Productor '{$productor->razon_social}' (Código Acceso: {$productor->codigo_acceso})\n";
    echo "  -> Creado VisitaAcceso ID #{$accesoProd->id} con codigo_visitante: {$accesoProd->codigo_visitante}\n\n";
    $accesoProd->delete();
}

// Test Visitante Particular
$accesoVis = VisitaAcceso::create([
    'tipo_acceso' => 'visitante',
    'visitante_nombre' => 'Visitante Prueba',
    'medio_acceso' => 'peatonal',
    'fecha_ingreso' => now()->toDateString(),
    'hora_ingreso' => now()->toTimeString(),
    'empresa_id' => 1,
    'sucursal_id' => 1,
    'status' => 1,
]);
echo "✓ Visitante Particular 'Visitante Prueba'\n";
echo "  -> Creado VisitaAcceso ID #{$accesoVis->id} con codigo_visitante (Rol 8): {$accesoVis->codigo_visitante}\n";
$accesoVis->delete();

echo "\n====================================================\n";
