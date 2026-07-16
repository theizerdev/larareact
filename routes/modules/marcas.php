<?php

use App\Http\Controllers\Admin\MarcaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/marcas', [MarcaController::class, 'index'])->name('marcas.index')->middleware('permission:marcas.view');
    Route::post('/marcas', [MarcaController::class, 'store'])->name('marcas.store')->middleware('permission:marcas.create');
    Route::put('/marcas/{marca}', [MarcaController::class, 'update'])->name('marcas.update')->middleware('permission:marcas.edit');
    Route::delete('/marcas/{marca}', [MarcaController::class, 'destroy'])->name('marcas.destroy')->middleware('permission:marcas.delete');
    Route::post('/marcas/bulk-destroy', [MarcaController::class, 'bulkDestroy'])->name('marcas.bulk-destroy')->middleware('permission:marcas.delete');
});
