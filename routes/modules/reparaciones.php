<?php

use App\Http\Controllers\Admin\ReparacionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::post('reparaciones/quick-cliente', [ReparacionController::class, 'storeCliente'])
        ->name('reparaciones.quick-cliente');
    Route::post('reparaciones/quick-marca', [ReparacionController::class, 'storeMarca'])
        ->name('reparaciones.quick-marca');
    Route::post('reparaciones/quick-modelo', [ReparacionController::class, 'storeModelo'])
        ->name('reparaciones.quick-modelo');
    Route::post('reparaciones/quick-servicio', [ReparacionController::class, 'storeServicio'])
        ->name('reparaciones.quick-servicio');
    Route::resource('reparaciones', ReparacionController::class);
    Route::post('reparaciones/{reparacion}/estado', [ReparacionController::class, 'updateEstado'])
        ->name('reparaciones.update-estado');
    Route::post('reparaciones/{reparacion}/items', [ReparacionController::class, 'addItem'])
        ->name('reparaciones.add-item');
    Route::delete('reparaciones/{reparacion}/items/{item}', [ReparacionController::class, 'removeItem'])
        ->name('reparaciones.remove-item');
    Route::post('reparaciones/{reparacion}/costos', [ReparacionController::class, 'updateCostos'])
        ->name('reparaciones.update-costos');
});
