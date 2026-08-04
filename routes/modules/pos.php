<?php

use App\Http\Controllers\Admin\PointOfSale\CashRegisterController;
use App\Http\Controllers\Admin\PointOfSale\ClienteController;
use App\Http\Controllers\Admin\PointOfSale\GoalController;
use App\Http\Controllers\Admin\PointOfSale\PurchaseController;
use App\Http\Controllers\Admin\PointOfSale\SaleController;
use App\Http\Controllers\Admin\PointOfSale\ServicioController;
use App\Http\Controllers\Admin\StockAlertController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Flujo de Caja
    Route::get('cajas/bcv-rate', [CashRegisterController::class, 'getBcvRate'])->name('cajas.bcv-rate');
    Route::resource('cajas', CashRegisterController::class)->only(['index', 'store', 'show']);
    Route::post('cajas/{caja}/movement', [CashRegisterController::class, 'addMovement'])->name('cajas.movement');
    Route::post('cajas/{caja}/close', [CashRegisterController::class, 'close'])->name('cajas.close');

    // Metas de Ventas POS
    Route::get('pos/metas', [GoalController::class, 'index'])->name('pos.metas.index');
    Route::post('pos/metas', [GoalController::class, 'store'])->name('pos.metas.store');

    // Servicios POS
    Route::resource('servicios', ServicioController::class)->except(['create', 'edit']);

    // Terminal POS & Ventas
    Route::get('ventas/terminal', [SaleController::class, 'terminal'])->name('ventas.terminal');
    Route::post('ventas/valor-dolar', [SaleController::class, 'updateValorDolar'])->name('ventas.valor-dolar');
    Route::resource('ventas', SaleController::class)->only(['index', 'store', 'show']);

    // Ventas en Espera
    Route::post('ventas/hold', [SaleController::class, 'holdSale'])->name('ventas.hold');
    Route::post('ventas/resume/{heldSale}', [SaleController::class, 'resumeSale'])->name('ventas.resume');
    Route::delete('ventas/held/{heldSale}', [SaleController::class, 'deleteHeldSale'])->name('ventas.held.delete');

    // Clientes y Cuentas por Cobrar
    Route::resource('clientes', ClienteController::class)->except(['create', 'edit']);
    Route::post('clientes/{cliente}/abono', [ClienteController::class, 'registrarAbono'])->name('clientes.abono');

    // Sector Compras & Cuentas por Pagar (CxP)
    Route::get('cuentas-por-pagar', [PurchaseController::class, 'accountsPayable'])->name('compras.cxp');
    Route::get('compras', [PurchaseController::class, 'index'])->name('compras.index');
    Route::get('compras/crear', [PurchaseController::class, 'create'])->name('compras.create');
    Route::post('compras', [PurchaseController::class, 'store'])->name('compras.store');
    Route::get('compras/{compra}', [PurchaseController::class, 'show'])->name('compras.show');
    Route::post('compras/{compra}/pagos', [PurchaseController::class, 'storePayment'])->name('compras.store-payment');
    Route::post('compras/{compra}/cancel', [PurchaseController::class, 'cancel'])->name('compras.cancel');

    // Alertas de Stock
    Route::get('stock-alerts', [StockAlertController::class, 'index'])->name('stock-alerts.index');
    Route::get('stock-alerts/count', [StockAlertController::class, 'count'])->name('stock-alerts.count');
});
