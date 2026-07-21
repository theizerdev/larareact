<?php

use App\Http\Controllers\Admin\PaisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // ... otras rutas
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
    Route::post('/paises', [PaisController::class, 'store'])->name('paises.store');
    Route::put('/paises/{pais}', [PaisController::class, 'update'])->name('paises.update');
    Route::post('/paises/bulk-destroy', [PaisController::class, 'bulkDestroy'])->name('paises.bulk-destroy');
});
