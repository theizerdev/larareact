<?php

use App\Http\Controllers\Admin\ReparacionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
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
