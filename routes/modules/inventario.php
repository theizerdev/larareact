<?php

use App\Http\Controllers\Admin\Inventario\InventoryAdjustmentController;
use App\Http\Controllers\Admin\Inventario\KardexController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Ajustes de Stock (Entradas y Salidas)
    Route::get('inventario/ajustes', [InventoryAdjustmentController::class, 'index'])->name('inventario.ajustes.index');
    Route::post('inventario/ajustes', [InventoryAdjustmentController::class, 'store'])->name('inventario.ajustes.store');

    // Kardex / Historial de Movimientos
    Route::get('inventario/kardex', [KardexController::class, 'index'])->name('inventario.kardex.index');
});
