<?php

use App\Http\Controllers\Admin\OpcionComidaController;
use Illuminate\Support\Facades\Route;

// Rutas de visualización (permiso asistencia.configuracion o asistencia.view)
Route::middleware(['permission:asistencia.configuracion|asistencia.view'])->group(function () {
    Route::get('/asistencia/comedor', [OpcionComidaController::class, 'index'])
        ->name('asistencia.comedor.index');
});

// Rutas de modificación (exigen asistencia.configuracion)
Route::middleware(['permission:asistencia.configuracion'])->group(function () {
    Route::post('/asistencia/comedor', [OpcionComidaController::class, 'store'])
        ->name('asistencia.comedor.store');
    Route::put('/asistencia/comedor/{opcionComida}', [OpcionComidaController::class, 'update'])
        ->name('asistencia.comedor.update');
    Route::patch('/asistencia/comedor/{opcionComida}/toggle', [OpcionComidaController::class, 'toggleStatus'])
        ->name('asistencia.comedor.toggle');
    Route::delete('/asistencia/comedor/{opcionComida}', [OpcionComidaController::class, 'destroy'])
        ->name('asistencia.comedor.destroy');
});
