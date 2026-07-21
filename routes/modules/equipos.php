<?php

use App\Http\Controllers\Admin\CategoriaController;
use App\Http\Controllers\Admin\FamiliaController;
use App\Http\Controllers\Admin\MarcaController;
use App\Http\Controllers\Admin\ModeloController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Categorías
    Route::resource('categorias', CategoriaController::class)->except(['create', 'edit']);
    
    // Marcas
    Route::resource('marcas', MarcaController::class)->except(['create', 'edit']);
    
    // Familias
    Route::resource('familias', FamiliaController::class)->except(['create', 'edit']);
    
    // Modelos
    Route::resource('modelos', ModeloController::class)->except(['create', 'edit']);
});
