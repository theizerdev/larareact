<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProveedorController;
use App\Http\Controllers\Admin\ProveedorEmpleadoController;

Route::middleware(['permission:proveedores.view'])->group(function () {
    Route::get('/proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
    Route::get('/proveedores/{proveedor}/empleados', [ProveedorEmpleadoController::class, 'index']);
});

Route::middleware(['permission:proveedores.create'])->group(function () {
    Route::post('/proveedores', [ProveedorController::class, 'store'])->name('proveedores.store');
    Route::post('/proveedores/{proveedor}/empleados', [ProveedorEmpleadoController::class, 'store']);
});

Route::middleware(['permission:proveedores.edit'])->group(function () {
    Route::put('/proveedores/{proveedor}', [ProveedorController::class, 'update'])->name('proveedores.update');
    Route::patch('/proveedores/{proveedor}/toggle-status', [ProveedorController::class, 'toggleStatus'])->name('proveedores.toggle-status');
    Route::post('/proveedor-empleados/{id}', [ProveedorEmpleadoController::class, 'update']);
});

Route::middleware(['permission:proveedores.delete'])->group(function () {
    Route::delete('/proveedores/{proveedor}', [ProveedorController::class, 'destroy'])->name('proveedores.destroy');
    Route::delete('/proveedor-empleados/{id}', [ProveedorEmpleadoController::class, 'destroy']);
});
