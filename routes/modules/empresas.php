<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\EmpresaController;

Route::middleware(['permission:empresas.view'])->group(function () {
    Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
});
Route::middleware(['permission:empresas.create'])->group(function () {
    Route::post('/empresas', [EmpresaController::class, 'store'])->name('empresas.store');
});
Route::middleware(['permission:empresas.edit'])->group(function () {
    Route::put('/empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::post('/empresas/{empresa}/logos', [EmpresaController::class, 'updateLogos'])->name('empresas.logos');
    Route::patch('/empresas/{empresa}/toggle-status', [EmpresaController::class, 'toggleStatus'])->name('empresas.toggle-status');
});
