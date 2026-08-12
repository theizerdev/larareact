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
    Route::post('reparaciones/check-imei', [ReparacionController::class, 'checkImei'])
        ->name('reparaciones.check-imei');
    Route::get('reparaciones/api-find', [ReparacionController::class, 'apiFind'])
        ->name('reparaciones.api-find');
    Route::resource('reparaciones', ReparacionController::class);
    Route::post('reparaciones/{reparacion}/estado', [ReparacionController::class, 'updateEstado'])
        ->name('reparaciones.update-estado');
    Route::post('reparaciones/{reparacion}/update-estado', [ReparacionController::class, 'updateEstado']);
    Route::post('reparaciones/{reparacion}/update-datos', [ReparacionController::class, 'updateDatos'])
        ->name('reparaciones.update-datos');
    Route::post('reparaciones/{reparacion}/add-foto', [ReparacionController::class, 'uploadFotoProceso'])
        ->name('reparaciones.add-foto');
    Route::delete('reparaciones/{reparacion}/fotos/{foto}', [ReparacionController::class, 'deleteFoto'])
        ->name('reparaciones.delete-foto');
    Route::post('reparaciones/{reparacion}/items', [ReparacionController::class, 'addItem'])
        ->name('reparaciones.add-item');
    Route::delete('reparaciones/{reparacion}/items/{item}', [ReparacionController::class, 'removeItem'])
        ->name('reparaciones.remove-item');
    Route::post('reparaciones/{reparacion}/costos', [ReparacionController::class, 'updateCostos'])
        ->name('reparaciones.update-costos');
    Route::get('reparaciones/{reparacion}/post-servicio', [ReparacionController::class, 'postServicioForm'])
        ->name('reparaciones.post-servicio');
    Route::post('reparaciones/{reparacion}/post-servicio', [ReparacionController::class, 'savePostServicio'])
        ->name('reparaciones.save-post-servicio');
    Route::get('reparaciones/{reparacion}/reporte-pdf', [ReparacionController::class, 'reportePdf'])
        ->name('reparaciones.reporte-pdf');
});
