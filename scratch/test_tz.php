<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;

echo "=== EMPLEADOS Y SUS SUCURSALES / DEPARTAMENTOS ===\n";
foreach (Empleado::with(['sucursal', 'departamento', 'cargo'])->get() as $e) {
    printf(
        "#%-2d | %-32s | Sucursal [%-2d]: %-28s | Dep: %-30s (DepSucursal: %s)\n",
        $e->id,
        $e->nombre_completo,
        $e->sucursal_id,
        $e->sucursal?->nombre ?? 'SIN SUCURSAL',
        $e->departamento?->nombre ?? 'SIN DEP',
        $e->departamento?->sucursal_id ?? 'N/A'
    );
}
