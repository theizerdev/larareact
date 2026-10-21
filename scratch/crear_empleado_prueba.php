<?php

// Uso: php scratch/crear_empleado_prueba.php
//
// Crea (o actualiza, es idempotente) un trabajador de prueba para el acceso
// por número de empleado de la app móvil: usuario SIN rol administrativo y
// empleado activo vinculado por empleados.user_id.

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empleado;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Con ceros a la izquierda, como salen en el gafete: en la app basta teclear 901.
const CODIGO = '00000901';
const EMAIL = 'prueba@shigoto.local';
const PASSWORD = 'password';

// Sin sesión no aplica el scope multitenant, así que empresa/sucursal se
// asignan explícitamente (la única que existe en local).
$user = User::withoutGlobalScopes()->updateOrCreate(
    ['email' => EMAIL],
    [
        'name' => 'Juan Prueba',
        'username' => 'juan.prueba',
        'password' => Hash::make(PASSWORD),
        'status' => 'activo',
        'empresa_id' => 1,
        'sucursal_id' => 1,
        'email_verified_at' => now(),
    ],
);
// Trabajador = sin rol administrativo. No se asigna ninguno a propósito.
$user->syncRoles([]);

$empleado = Empleado::withoutGlobalScopes()->updateOrCreate(
    ['codigo_acceso' => CODIGO],
    [
        'nombres' => 'Juan',
        'apellidos' => 'Prueba',
        'documento_identidad' => '000901',
        'correo' => EMAIL,
        'empresa_id' => 1,
        'sucursal_id' => 1,
        'user_id' => $user->id,
        'status' => true,
    ],
);

echo PHP_EOL;
echo "Empleado #{$empleado->id}  {$empleado->nombres} {$empleado->apellidos}".PHP_EOL;
echo '  Número de empleado (app): '.CODIGO.'  (o simplemente 901)'.PHP_EOL;
echo "  Usuario #{$user->id}  ".EMAIL.'  /  '.PASSWORD.'   roles=['.$user->getRoleNames()->join(',').']'.PHP_EOL;
echo PHP_EOL;
