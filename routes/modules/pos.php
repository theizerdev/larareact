<?php

use App\Http\Controllers\Admin\PointOfSale\CashRegisterController;
use App\Http\Controllers\Admin\PointOfSale\ClienteController;
use App\Http\Controllers\Admin\PointOfSale\SaleController;
use App\Http\Controllers\Admin\PointOfSale\ServicioController;
use App\Http\Controllers\Admin\StockAlertController;
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

    // Ventas en Espera
    Route::post('ventas/hold', [SaleController::class, 'holdSale'])->name('ventas.hold');
    Route::post('ventas/resume/{heldSale}', [SaleController::class, 'resumeSale'])->name('ventas.resume');
    Route::delete('ventas/held/{heldSale}', [SaleController::class, 'deleteHeldSale'])->name('ventas.held.delete');

    // Clientes y Cuentas por Cobrar
    Route::resource('clientes', ClienteController::class)->except(['create', 'edit']);
    Route::post('clientes/{cliente}/abono', [ClienteController::class, 'registrarAbono'])->name('clientes.abono');

    // Alertas de Stock
    Route::get('stock-alerts', [StockAlertController::class, 'index'])->name('stock-alerts.index');
    Route::get('stock-alerts/count', [StockAlertController::class, 'count'])->name('stock-alerts.count');
});
