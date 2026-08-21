<?php

use App\Http\Controllers\Admin\PaisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:paises.view'])->group(function () {
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
});
Route::middleware(['permission:paises.create'])->group(function () {
    Route::post('/paises', [PaisController::class, 'store'])->name('paises.store');
});
Route::middleware(['permission:paises.edit'])->group(function () {
    Route::put('/paises/{pais}', [PaisController::class, 'update'])->name('paises.update');
});
Route::middleware(['permission:paises.delete'])->group(function () {
    Route::post('/paises/bulk-destroy', [PaisController::class, 'bulkDestroy'])->name('paises.bulk-destroy');
});
