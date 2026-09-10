<?php

use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\ModeloEquipoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Rutas de Marcas
    Route::get('/catalogo/marcas', [MarcaController::class, 'index'])->name('catalogo.marcas.index');
    Route::post('/catalogo/marcas', [MarcaController::class, 'store'])->name('catalogo.marcas.store');
    Route::put('/catalogo/marcas/{marca}', [MarcaController::class, 'update'])->name('catalogo.marcas.update');
    Route::patch('/catalogo/marcas/{marca}/toggle-status', [MarcaController::class, 'toggleStatus'])->name('catalogo.marcas.toggle-status');
    Route::delete('/catalogo/marcas/{marca}', [MarcaController::class, 'destroy'])->name('catalogo.marcas.destroy');

    // Rutas de Modelos de Teléfonos
    Route::get('/catalogo/modelos', [ModeloEquipoController::class, 'index'])->name('catalogo.modelos.index');
    Route::post('/catalogo/modelos', [ModeloEquipoController::class, 'store'])->name('catalogo.modelos.store');
    Route::put('/catalogo/modelos/{modelo}', [ModeloEquipoController::class, 'update'])->name('catalogo.modelos.update');
    Route::patch('/catalogo/modelos/{modelo}/toggle-status', [ModeloEquipoController::class, 'toggleStatus'])->name('catalogo.modelos.toggle-status');
    Route::delete('/catalogo/modelos/{modelo}', [ModeloEquipoController::class, 'destroy'])->name('catalogo.modelos.destroy');
});

