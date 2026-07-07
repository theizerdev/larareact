<?php

use App\Http\Controllers\Admin\PaisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // ... otras rutas
    Route::get('/paises', [App\Http\Controllers\Admin\PaisController::class, 'index'])->name('paises.index');
    Route::post('/paises', [App\Http\Controllers\Admin\PaisController::class, 'store'])->name('paises.store');
    Route::put('/paises/{pais}', [App\Http\Controllers\Admin\PaisController::class, 'update'])->name('paises.update');
    Route::post('/paises/bulk-destroy', [App\Http\Controllers\Admin\PaisController::class, 'bulkDestroy'])->name('paises.bulk-destroy');
});
