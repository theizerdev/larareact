<?php

use App\Http\Controllers\Admin\PointOfSale\CashRegisterController;
use App\Http\Controllers\Admin\PointOfSale\SaleController;
use App\Http\Controllers\Admin\PointOfSale\ServicioController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Flujo de Caja
    Route::resource('cajas', CashRegisterController::class)->only(['index', 'store', 'show']);
    Route::post('cajas/{caja}/movement', [CashRegisterController::class, 'addMovement'])->name('cajas.movement');
    Route::post('cajas/{caja}/close', [CashRegisterController::class, 'close'])->name('cajas.close');

    // Servicios POS
    Route::resource('servicios', ServicioController::class)->except(['create', 'edit']);

    // Terminal POS & Ventas
    Route::get('ventas/terminal', [SaleController::class, 'terminal'])->name('ventas.terminal');
    Route::resource('ventas', SaleController::class)->only(['index', 'store', 'show']);
});
