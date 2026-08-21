<?php

use App\Http\Controllers\Admin\SucursalController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:sucursales.view'])->group(function () {
    Route::get('/sucursales', [SucursalController::class, 'index'])->name('sucursales.index');
});
Route::middleware(['permission:sucursales.create'])->group(function () {
    Route::post('/sucursales', [SucursalController::class, 'store'])->name('sucursales.store');
});
Route::middleware(['permission:sucursales.edit'])->group(function () {
    Route::put('/sucursales/{sucursal}', [SucursalController::class, 'update'])->name('sucursales.update');
    Route::patch('/sucursales/{sucursal}/toggle-status', [SucursalController::class, 'toggleStatus'])->name('sucursales.toggle-status');
});
Route::middleware(['permission:sucursales.delete'])->group(function () {
    Route::delete('/sucursales/{sucursal}', [SucursalController::class, 'destroy'])->name('sucursales.destroy');
});
