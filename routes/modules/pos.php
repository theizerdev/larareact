<?php

use App\Http\Controllers\Admin\PointOfSale\CashRegisterController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('cajas', CashRegisterController::class)->only(['index', 'store', 'show']);
    Route::post('cajas/{caja}/movement', [CashRegisterController::class, 'addMovement'])->name('cajas.movement');
    Route::post('cajas/{caja}/close', [CashRegisterController::class, 'close'])->name('cajas.close');
});
