<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\CargoController;

Route::middleware(['permission:cargos.view'])->group(function () {
    Route::get('/cargos', [CargoController::class, 'index'])->name('cargos.index');
});

Route::middleware(['permission:cargos.create'])->group(function () {
    Route::post('/cargos', [CargoController::class, 'store'])->name('cargos.store');
});

Route::middleware(['permission:cargos.edit'])->group(function () {
    Route::put('/cargos/{cargo}', [CargoController::class, 'update'])->name('cargos.update');
    Route::patch('/cargos/{cargo}/toggle-status', [CargoController::class, 'toggleStatus'])->name('cargos.toggle-status');
});

Route::middleware(['permission:cargos.delete'])->group(function () {
    Route::delete('/cargos/{cargo}', [CargoController::class, 'destroy'])->name('cargos.destroy');
});
