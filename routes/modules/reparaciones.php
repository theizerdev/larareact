<?php

use App\Http\Controllers\Admin\ReparacionController;
use App\Http\Controllers\Admin\ReparacionChecklistController;
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

    // ── GESTIÓN DE CHECKLIST DE POST-ATENCIÓN POR EMPRESA/SUCURSAL (Debe ir antes de resource) ──
    Route::get('reparaciones/post-reparacion', [ReparacionChecklistController::class, 'indexPage'])
        ->name('reparaciones.post-reparacion');
    Route::get('reparaciones/checklist', [ReparacionChecklistController::class, 'index'])
        ->name('reparaciones.checklist.index');

    Route::post('reparaciones/checklist', [ReparacionChecklistController::class, 'store'])
        ->name('reparaciones.checklist.store');
    Route::put('reparaciones/checklist/{item}', [ReparacionChecklistController::class, 'update'])
        ->name('reparaciones.checklist.update');
    Route::delete('reparaciones/checklist/{item}', [ReparacionChecklistController::class, 'destroy'])
        ->name('reparaciones.checklist.destroy');
    Route::post('reparaciones/checklist/reorder', [ReparacionChecklistController::class, 'reorder'])
        ->name('reparaciones.checklist.reorder');
    Route::post('reparaciones/checklist/batch-toggle', [ReparacionChecklistController::class, 'batchToggle'])
        ->name('reparaciones.checklist.batch-toggle');
    Route::post('reparaciones/checklist/{item}/duplicate', [ReparacionChecklistController::class, 'duplicate'])
        ->name('reparaciones.checklist.duplicate');
    Route::post('reparaciones/checklist/reset-defaults', [ReparacionChecklistController::class, 'resetDefaults'])
        ->name('reparaciones.checklist.reset');
    Route::post('reparaciones/checklist/copy-to-branch', [ReparacionChecklistController::class, 'copyToBranch'])
        ->name('reparaciones.checklist.copy-to-branch');

    Route::resource('reparaciones', ReparacionController::class);
    Route::get('reparaciones/{reparacion}/estado', function ($reparacion) {
        return redirect()->route('admin.reparaciones.show', $reparacion);
    });
    Route::post('reparaciones/{reparacion}/estado', [ReparacionController::class, 'updateEstado'])
        ->name('reparaciones.update-estado');
    Route::get('reparaciones/{reparacion}/update-estado', function ($reparacion) {
        return redirect()->route('admin.reparaciones.show', $reparacion);
    });
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
    Route::get('reparaciones/{reparacion}/preservicio', function ($reparacion) {
        return redirect()->route('admin.reparaciones.show', $reparacion);
    });
    Route::post('reparaciones/{reparacion}/preservicio', [ReparacionController::class, 'savePreservicio'])
        ->name('reparaciones.preservicio');
    Route::get('reparaciones/{reparacion}/post-servicio', [ReparacionController::class, 'postServicioForm'])
        ->name('reparaciones.post-servicio');
    Route::post('reparaciones/{reparacion}/post-servicio', [ReparacionController::class, 'savePostServicio'])
        ->name('reparaciones.save-post-servicio');
    Route::post('reparaciones/{reparacion}/notificar-whatsapp', [ReparacionController::class, 'notificarWhatsApp'])
        ->name('reparaciones.notificar-whatsapp');
});


