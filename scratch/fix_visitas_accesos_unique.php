<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

echo "Dropping unique index from visitas_accesos.codigo_visitante if exists...\n";

try {
    Schema::table('visitas_accesos', function (Blueprint $table) {
        $table->dropUnique('visitas_accesos_codigo_visitante_unique');
    });
    echo "✓ Index 'visitas_accesos_codigo_visitante_unique' dropped successfully!\n";
} catch (\Exception $e) {
    echo "Info: " . $e->getMessage() . "\n";
}

// Ensure index exists for fast searches
try {
    Schema::table('visitas_accesos', function (Blueprint $table) {
        $table->index('codigo_visitante', 'visitas_accesos_codigo_visitante_index');
    });
    echo "✓ Added normal index on 'codigo_visitante'.\n";
} catch (\Exception $e) {
    echo "Info: " . $e->getMessage() . "\n";
}

echo "Done!\n";
