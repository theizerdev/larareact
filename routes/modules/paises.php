<?php

use App\Http\Controllers\Admin\PaisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:paises.view'])->group(function () {
    Route::get('/paises', [PaisController::class, 'index'])->name('paises.index');
});
// Los países son un catálogo de toda la plataforma: sólo el Super Administrador
// lo modifica (un admin de una empresa lo cambiaría para todas las demás).
Route::middleware(['permission:paises.create', 'superadmin'])->group(function () {
    Route::post('/paises', [PaisController::class, 'store'])->name('paises.store');
});
Route::middleware(['permission:paises.edit', 'superadmin'])->group(function () {
    Route::put('/paises/{pais}', [PaisController::class, 'update'])->name('paises.update');
});
Route::middleware(['permission:paises.delete', 'superadmin'])->group(function () {
    Route::post('/paises/bulk-destroy', [PaisController::class, 'bulkDestroy'])->name('paises.bulk-destroy');
});
