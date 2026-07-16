<?php

use App\Http\Controllers\Admin\CategoriaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/categorias', [CategoriaController::class, 'index'])->name('categorias.index')->middleware('permission:categorias.view');
    Route::post('/categorias', [CategoriaController::class, 'store'])->name('categorias.store')->middleware('permission:categorias.create');
    Route::put('/categorias/{categoria}', [CategoriaController::class, 'update'])->name('categorias.update')->middleware('permission:categorias.edit');
    Route::delete('/categorias/{categoria}', [CategoriaController::class, 'destroy'])->name('categorias.destroy')->middleware('permission:categorias.delete');
    Route::post('/categorias/bulk-destroy', [CategoriaController::class, 'bulkDestroy'])->name('categorias.bulk-destroy')->middleware('permission:categorias.delete');
});
