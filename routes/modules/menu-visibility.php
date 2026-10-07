<?php

use App\Http\Controllers\Admin\MenuVisibilityController;
use Illuminate\Support\Facades\Route;

// Visibilidad del menú lateral (empresa + rol). El grupo admin.php ya aplica
// ['web','auth'] y el prefijo /admin. El candado de superadmin va dentro del
// controlador (mismo criterio que otros módulos sensibles de este código base).
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/seguridad/menu-visibilidad', [MenuVisibilityController::class, 'index'])
        ->name('seguridad.menu-visibilidad.index');
    Route::put('/seguridad/menu-visibilidad/empresa/{empresa}', [MenuVisibilityController::class, 'updateEmpresa'])
        ->whereNumber('empresa')
        ->name('seguridad.menu-visibilidad.empresa');
    Route::put('/seguridad/menu-visibilidad/rol/{role}', [MenuVisibilityController::class, 'updateRole'])
        ->whereNumber('role')
        ->name('seguridad.menu-visibilidad.rol');

    // URL anterior (estaba bajo Configuración)
    Route::redirect('/configuracion/menu-visibilidad', '/admin/seguridad/menu-visibilidad');
});
