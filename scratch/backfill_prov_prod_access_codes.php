<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Proveedor;
use App\Models\Productor;
use App\Services\AccessCodeService;

echo "Backfilling codigo_acceso for Proveedores...\n";
$provs = Proveedor::whereNull('codigo_acceso')->orWhere('codigo_acceso', '')->get();
foreach ($provs as $prov) {
    $code = AccessCodeService::generate('5', $prov->sucursal_id);
    $prov->update(['codigo_acceso' => $code]);
    echo "  Proveedor #{$prov->id} ({$prov->razon_social}) -> {$code}\n";
}

echo "Backfilling codigo_acceso for Productores...\n";
$prods = Productor::whereNull('codigo_acceso')->orWhere('codigo_acceso', '')->get();
foreach ($prods as $prod) {
    $code = AccessCodeService::generate('3', $prod->sucursal_id);
    $prod->update(['codigo_acceso' => $code]);
    echo "  Productor #{$prod->id} ({$prod->razon_social}) -> {$code}\n";
}

echo "Done!\n";
