<?php

// Uso: php scratch/inspeccionar_para_empleado_prueba.php
// Sólo lectura: muestra catálogos para armar un empleado de prueba.

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Empleado;
use App\Models\Empresa;
use App\Models\Sucursal;
use App\Models\TurnoLaboral;
use App\Models\User;
use Spatie\Permission\Models\Role;

echo 'ROLES: '.Role::pluck('name')->join(', ').PHP_EOL;

// Los catálogos no comparten nombre de columna para el "nombre"; se toma la
// primera que exista.
$etiqueta = fn ($m) => $m->nombre ?? $m->razon_social ?? $m->nombre_comercial ?? $m->name ?? '?';

echo 'EMPRESAS: '.Empresa::withoutGlobalScopes()->get()
    ->map(fn ($e) => "{$e->id}=".$etiqueta($e))->join(' | ').PHP_EOL;

echo 'SUCURSALES: '.Sucursal::withoutGlobalScopes()->get()
    ->map(fn ($s) => "{$s->id}=".$etiqueta($s)." (emp {$s->empresa_id})")->join(' | ').PHP_EOL;

echo 'TURNOS: '.TurnoLaboral::withoutGlobalScopes()->get()
    ->map(fn ($t) => "{$t->id}=".$etiqueta($t)." (emp {$t->empresa_id})")->join(' | ').PHP_EOL;

// Cómo están configurados los trabajadores que ya tienen cuenta vinculada.
$vinculados = Empleado::withoutGlobalScopes()->whereNotNull('user_id')->with('user')->latest('id')->take(3)->get();
foreach ($vinculados as $v) {
    echo "VINCULADO: emp {$v->id} {$v->nombres} {$v->apellidos} codigo={$v->codigo_acceso} empresa={$v->empresa_id} suc={$v->sucursal_id} turno={$v->turno_laboral_id}"
        .' -> user '.($v->user?->id).' '.($v->user?->email).' roles=['.($v->user?->getRoleNames()->join(',')).']'.PHP_EOL;
}

$e = Empleado::withoutGlobalScopes()->whereNotNull('codigo_acceso')->latest('id')->first();
echo 'EJEMPLO EMPLEADO: '.json_encode($e?->only([
    'id', 'nombres', 'apellidos', 'documento_identidad', 'codigo_acceso',
    'empresa_id', 'sucursal_id', 'turno_laboral_id', 'user_id', 'status',
]), JSON_UNESCAPED_UNICODE).PHP_EOL;

echo 'EMPLEADOS CON USER: '.Empleado::withoutGlobalScopes()->whereNotNull('user_id')->count()
    .' / '.Empleado::withoutGlobalScopes()->count().PHP_EOL;

echo 'USERS: '.User::withoutGlobalScopes()->count().PHP_EOL;
echo 'YA EXISTE prueba@shigoto.local? '.(User::withoutGlobalScopes()->where('email', 'prueba@shigoto.local')->exists() ? 'sí' : 'no').PHP_EOL;
echo 'YA EXISTE codigo 99999901? '.(Empleado::withoutGlobalScopes()->where('codigo_acceso', '99999901')->exists() ? 'sí' : 'no').PHP_EOL;
