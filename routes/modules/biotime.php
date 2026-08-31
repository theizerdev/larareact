<?php

use App\Http\Controllers\Admin\BioTimeController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Lectura del espejo de BioTime
    Route::middleware(['permission:biotime.view'])->group(function () {
        Route::get('/biotime/dispositivos', [BioTimeController::class, 'dispositivos'])->name('biotime.dispositivos');
        Route::get('/biotime/empleados', [BioTimeController::class, 'empleados'])->name('biotime.empleados');
        Route::get('/biotime/empleados/{biotimeEmpleado}/foto', [BioTimeController::class, 'fotoEmpleado'])->name('biotime.empleados.foto');
        Route::get('/biotime/marcajes', [BioTimeController::class, 'marcajes'])->name('biotime.marcajes');
    });

    // Acciones (sincronizar / vincular)
    Route::middleware(['permission:biotime.manage'])->group(function () {
        Route::post('/biotime/sync', [BioTimeController::class, 'syncNow'])->name('biotime.sync');
        Route::post('/biotime/empleados/auto-vincular', [BioTimeController::class, 'autoVincular'])->name('biotime.empleados.auto-vincular');
        Route::put('/biotime/empleados/{biotimeEmpleado}/vincular', [BioTimeController::class, 'vincular'])->name('biotime.empleados.vincular');
    });
});
