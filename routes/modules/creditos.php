<?php

use App\Http\Controllers\Admin\CreditoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/creditos', [CreditoController::class, 'index'])->name('creditos.index');
    Route::get('/creditos/nuevo', [CreditoController::class, 'create'])->name('creditos.create');
    Route::post('/creditos/simular', [CreditoController::class, 'simular'])->name('creditos.simular');
    Route::post('/creditos', [CreditoController::class, 'store'])->name('creditos.store');
    Route::get('/creditos/{credito}', [CreditoController::class, 'show'])->name('creditos.show');
    Route::post('/cuotas/{cuota}/pagar', [CreditoController::class, 'pagarCuota'])->name('cuotas.pagar');
});

