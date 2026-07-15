<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\EmpleadoController;

Route::middleware(['permission:empleados.view'])->group(function () {
    Route::get('/empleados', [EmpleadoController::class, 'index'])->name('empleados.index');
    Route::get('/empleados/{empleado}/carnet', [EmpleadoController::class, 'carnet'])->name('empleados.carnet');
});

Route::middleware(['permission:empleados.create'])->group(function () {
    Route::post('/empleados', [EmpleadoController::class, 'store'])->name('empleados.store');
});

Route::middleware(['permission:empleados.edit'])->group(function () {
    Route::put('/empleados/{empleado}', [EmpleadoController::class, 'update'])->name('empleados.update');
    Route::patch('/empleados/{empleado}/toggle-status', [EmpleadoController::class, 'toggleStatus'])->name('empleados.toggle-status');
});

Route::middleware(['permission:empleados.delete'])->group(function () {
    Route::delete('/empleados/{empleado}', [EmpleadoController::class, 'destroy'])->name('empleados.destroy');
});
