<?php

use App\Http\Controllers\Admin\ProveedorController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('proveedores', [ProveedorController::class, 'index'])
        ->name('proveedores.index')
        ->middleware('permission:proveedores.view');

    Route::post('proveedores', [ProveedorController::class, 'store'])
        ->name('proveedores.store')
        ->middleware('permission:proveedores.create');

    Route::put('proveedores/{proveedor}', [ProveedorController::class, 'update'])
        ->name('proveedores.update')
        ->middleware('permission:proveedores.edit');

    Route::delete('proveedores/{proveedor}', [ProveedorController::class, 'destroy'])
        ->name('proveedores.destroy')
        ->middleware('permission:proveedores.delete');
});

