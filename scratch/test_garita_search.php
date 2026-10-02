<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;
use App\Models\Proveedor;
use App\Models\Productor;

echo "====================================================\n";
echo " PRUEBA DE BÚSQUEDA DE GARITA CONTROL DE ACCESO\n";
echo "====================================================\n\n";

$empleado = Empleado::whereNotNull('codigo_acceso')->first();
$proveedor = Proveedor::whereNotNull('codigo_acceso')->first();
$productor = Productor::whereNotNull('codigo_acceso')->first();

$controller = new \App\Http\Controllers\Admin\VisitaAccesoController();

if ($empleado) {
    echo "--- PRUEBA EMPLEADO: {$empleado->nombre_completo} [CÓD: {$empleado->codigo_acceso}] ---\n";
    $testQueries = [
        $empleado->codigo_acceso,             // 8D
        ltrim($empleado->codigo_acceso, '0'), // 7D
        $empleado->documento_identidad,       // 6D
    ];

    foreach ($testQueries as $q) {
        $req = \Illuminate\Http\Request::create('/admin/visitas-accesos/garita', 'GET', ['q' => $q]);
        $res = $controller->garita($req);
        $pageProps = $res->toResponse($req)->original->getData()['page']['props'];
        $found = $pageProps['resultado'];

        if ($found && $found['tipo'] === 'empleado') {
            $emp = $found['data'];
            $nom = is_array($emp) ? ($emp['nombres'] ?? '') : $emp->nombres;
            $cod = is_array($emp) ? ($emp['codigo_acceso'] ?? '') : $emp->codigo_acceso;
            echo "✓ Garita Búsqueda por '{$q}' -> Encontrado Empleado: {$nom} [CÓD: {$cod}]\n";
        } else {
            echo "❌ Garita Búsqueda por '{$q}' -> No encontrado\n";
        }
    }
}

if ($proveedor) {
    echo "\n--- PRUEBA PROVEEDOR: {$proveedor->razon_social} [CÓD: {$proveedor->codigo_acceso}] ---\n";
    $testQueries = [
        $proveedor->codigo_acceso,             // 8D
        ltrim($proveedor->codigo_acceso, '0'), // 7D
    ];

    foreach ($testQueries as $q) {
        $req = \Illuminate\Http\Request::create('/admin/visitas-accesos/garita', 'GET', ['q' => $q]);
        $res = $controller->garita($req);
        $pageProps = $res->toResponse($req)->original->getData()['page']['props'];
        $found = $pageProps['resultado'];

        if ($found && $found['tipo'] === 'proveedor') {
            $prov = $found['data'];
            $nom = is_array($prov) ? ($prov['razon_social'] ?? '') : $prov->razon_social;
            $cod = is_array($prov) ? ($prov['codigo_acceso'] ?? '') : $prov->codigo_acceso;
            echo "✓ Garita Búsqueda por '{$q}' -> Encontrado Proveedor: {$nom} [CÓD: {$cod}]\n";
        } else {
            echo "❌ Garita Búsqueda por '{$q}' -> No encontrado\n";
        }
    }
}

if ($productor) {
    echo "\n--- PRUEBA PRODUCTOR: {$productor->razon_social} [CÓD: {$productor->codigo_acceso}] ---\n";
    $testQueries = [
        $productor->codigo_acceso,             // 8D
        ltrim($productor->codigo_acceso, '0'), // 7D
    ];

    foreach ($testQueries as $q) {
        $req = \Illuminate\Http\Request::create('/admin/visitas-accesos/garita', 'GET', ['q' => $q]);
        $res = $controller->garita($req);
        $pageProps = $res->toResponse($req)->original->getData()['page']['props'];
        $found = $pageProps['resultado'];

        if ($found && $found['tipo'] === 'productor') {
            $prod = $found['data'];
            $nom = is_array($prod) ? ($prod['razon_social'] ?? '') : $prod->razon_social;
            $cod = is_array($prod) ? ($prod['codigo_acceso'] ?? '') : $prod->codigo_acceso;
            echo "✓ Garita Búsqueda por '{$q}' -> Encontrado Productor: {$nom} [CÓD: {$cod}]\n";
        } else {
            echo "❌ Garita Búsqueda por '{$q}' -> No encontrado\n";
        }
    }
}

echo "\n====================================================\n";
