<?php

use App\Http\Controllers\Admin\ComisionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('comisiones', [ComisionController::class, 'index'])->name('comisiones.index');
    Route::post('comisiones/pagar', [ComisionController::class, 'pagar'])->name('comisiones.pagar');
    Route::get('comisiones/empleado/{empleado}/pendientes', [ComisionController::class, 'pendingSales'])->name('comisiones.pendientes');
    Route::get('comisiones/ticket/{comisionPago}', [ComisionController::class, 'ticket'])->name('comisiones.ticket');
});
