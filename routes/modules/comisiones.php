<?php

use App\Http\Controllers\Admin\ComisionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('comisiones', [ComisionController::class, 'index'])->name('comisiones.index');
    Route::post('comisiones/pagar', [ComisionController::class, 'pagar'])->name('comisiones.pagar');
    Route::post('comisiones/sync-taller', [ComisionController::class, 'syncTaller'])->name('comisiones.sync-taller');
    Route::post('comisiones/actualizar-pct-taller', [ComisionController::class, 'updateWorkshopPercentage'])->name('comisiones.actualizar-pct-taller');
    Route::post('comisiones/sync-ventas', [ComisionController::class, 'syncVentas'])->name('comisiones.sync-ventas');
    Route::post('comisiones/actualizar-pct-ventas', [ComisionController::class, 'updateSalesPercentage'])->name('comisiones.actualizar-pct-ventas');
    Route::get('comisiones/empleado/{empleado}/pendientes', [ComisionController::class, 'pendingSales'])->name('comisiones.pendientes');
    Route::get('comisiones/ticket/{comisionPago}', [ComisionController::class, 'ticket'])->name('comisiones.ticket');
});

