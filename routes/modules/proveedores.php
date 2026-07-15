<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ProveedorController;

Route::middleware(['permission:proveedores.view'])->group(function () {
    Route::get('/proveedores', [ProveedorController::class, 'index'])->name('proveedores.index');
});

Route::middleware(['permission:proveedores.create'])->group(function () {
    Route::post('/proveedores', [ProveedorController::class, 'store'])->name('proveedores.store');
});

Route::middleware(['permission:proveedores.edit'])->group(function () {
    Route::put('/proveedores/{proveedor}', [ProveedorController::class, 'update'])->name('proveedores.update');
    Route::patch('/proveedores/{proveedor}/toggle-status', [ProveedorController::class, 'toggleStatus'])->name('proveedores.toggle-status');
});

Route::middleware(['permission:proveedores.delete'])->group(function () {
    Route::delete('/proveedores/{proveedor}', [ProveedorController::class, 'destroy'])->name('proveedores.destroy');
});
