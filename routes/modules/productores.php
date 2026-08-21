<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProductorController;
use App\Http\Controllers\Admin\ProductorEmpleadoController;
use App\Http\Controllers\Admin\ProductorVehiculoController;

Route::middleware(['permission:productores.view'])->group(function () {
    Route::get('/productores', [ProductorController::class, 'index'])->name('productores.index');
    Route::get('/productores/{productor}/empleados', [ProductorEmpleadoController::class, 'index']);
    Route::get('/productores/{productor}/vehiculos', [ProductorVehiculoController::class, 'index']);
});

Route::middleware(['permission:productores.create'])->group(function () {
    Route::post('/productores', [ProductorController::class, 'store'])->name('productores.store');
    Route::post('/productores/pre-registro', [ProductorController::class, 'generatePreRegistro'])->name('productores.pre-registro');
    Route::post('/productores/{productor}/empleados', [ProductorEmpleadoController::class, 'store']);
    Route::post('/productores/{productor}/vehiculos', [ProductorVehiculoController::class, 'store']);
});

Route::middleware(['permission:productores.edit'])->group(function () {
    Route::put('/productores/{productor}', [ProductorController::class, 'update'])->name('productores.update');
    Route::patch('/productores/{productor}/toggle-status', [ProductorController::class, 'toggleStatus'])->name('productores.toggle-status');
    Route::post('/productor-empleados/{id}', [ProductorEmpleadoController::class, 'update']);
    Route::post('/productor-vehiculos/{id}', [ProductorVehiculoController::class, 'update']);
});

Route::middleware(['permission:productores.delete'])->group(function () {
    Route::delete('/productores/{productor}', [ProductorController::class, 'destroy'])->name('productores.destroy');
    Route::delete('/productor-empleados/{id}', [ProductorEmpleadoController::class, 'destroy']);
    Route::delete('/productor-vehiculos/{id}', [ProductorVehiculoController::class, 'destroy']);
});
