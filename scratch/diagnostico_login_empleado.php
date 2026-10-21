<?php

// Uso: php scratch/diagnostico_login_empleado.php [numero]
// Sólo lectura. Reproduce la resolución de AuthController::loginEmpleado y
// explica por qué un número entra o no.

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empleado;

$ROLES_ADMIN = ['super-admin', 'admin', 'operador', 'encargado'];

echo 'BD: '.config('database.connections.'.config('database.default').'.database').PHP_EOL;

$total = Empleado::withoutGlobalScopes()->count();
$conUser = Empleado::withoutGlobalScopes()->whereNotNull('user_id')->count();
$activos = Empleado::withoutGlobalScopes()->where('status', true)->count();
echo "EMPLEADOS: total={$total}  activos={$activos}  con user_id={$conUser}".PHP_EOL.PHP_EOL;

echo 'PRIMEROS 10:'.PHP_EOL;
foreach (Empleado::withoutGlobalScopes()->with('user')->orderBy('id')->take(10)->get() as $e) {
    $roles = $e->user ? $e->user->getRoleNames()->join(',') : '';
    printf(
        "  #%-3d %-32s acceso=%-10s doc=%-8s activo=%-2s user_id=%-5s %s%s".PHP_EOL,
        $e->id,
        mb_substr($e->nombres.' '.$e->apellidos, 0, 32),
        $e->codigo_acceso ?: '-',
        $e->documento_identidad ?: '-',
        $e->status ? 'si' : 'NO',
        $e->user_id ?: 'NULL',
        $e->user?->email ?? '',
        $roles ? " roles=[{$roles}]" : ''
    );
}

// Simula el login para el número indicado.
$entrada = $argv[1] ?? '101001';
echo PHP_EOL."SIMULACION para '{$entrada}':".PHP_EOL;

$query = trim($entrada);
$cleanQuery = preg_replace('/[^a-zA-Z0-9]/', '', $query);
$isNumeric = ctype_digit($cleanQuery);
$intVal = $isNumeric ? (int) $cleanQuery : null;

$empleado = Empleado::withoutGlobalScopes()->with('user')
    ->where('status', true)
    ->where(function ($q) use ($query, $cleanQuery, $isNumeric, $intVal) {
        $q->where('codigo_acceso', $query)
            ->orWhere('codigo_acceso', $cleanQuery)
            ->orWhere('documento_identidad', $query)
            ->orWhere('documento_identidad', $cleanQuery);

        if ($isNumeric && $intVal > 0) {
            $q->orWhere('codigo_acceso', sprintf('%08d', $intVal))
                ->orWhere('documento_identidad', sprintf('%06d', $intVal))
                ->orWhere('codigo_acceso', (string) $intVal)
                ->orWhere('documento_identidad', (string) $intVal);
        }
    })
    ->first();

if (! $empleado) {
    echo '  -> 401 Numero de empleado no valido (no hay empleado ACTIVO con ese numero)'.PHP_EOL;
    $inactivo = Empleado::withoutGlobalScopes()
        ->where('codigo_acceso', $query)->orWhere('documento_identidad', $query)->first();
    if ($inactivo) {
        echo "     (pero existe el empleado #{$inactivo->id} con status=".($inactivo->status ? 'activo' : 'INACTIVO').')'.PHP_EOL;
    }
    exit;
}

echo "  Empleado #{$empleado->id} {$empleado->nombres} {$empleado->apellidos}".PHP_EOL;

if (! $empleado->user) {
    echo '  -> 403 Tu numero no esta vinculado a una cuenta de acceso (empleados.user_id es NULL)'.PHP_EOL;
    exit;
}

$user = $empleado->user;
echo "  Usuario #{$user->id} {$user->email} roles=[".$user->getRoleNames()->join(',').']'.PHP_EOL;

if ($user->hasAnyRole($ROLES_ADMIN)) {
    echo '  -> 403 Cuenta administrativa: debe entrar con correo y contrasena'.PHP_EOL;
    exit;
}

if ($user->status && $user->status !== 'activo') {
    echo "  -> 403 Cuenta inactiva (users.status={$user->status})".PHP_EOL;
    exit;
}

echo '  -> 200 OK, este numero SI puede entrar'.PHP_EOL;
