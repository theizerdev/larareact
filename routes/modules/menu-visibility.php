<?php

use App\Http\Controllers\Admin\MenuVisibilityController;
use Illuminate\Support\Facades\Route;

// Visibilidad del menú lateral. El grupo admin.php ya aplica ['web','auth']
// y el prefijo /admin. El candado de superadmin va dentro del controlador
// (mismo criterio que otros módulos sensibles de este código base).
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/configuracion/menu-visibilidad', [MenuVisibilityController::class, 'index'])
        ->name('configuracion.menu-visibilidad.index');
    Route::put('/configuracion/menu-visibilidad', [MenuVisibilityController::class, 'update'])
        ->name('configuracion.menu-visibilidad.update');
});
