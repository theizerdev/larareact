<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\EmpresaController;

Route::middleware(['verified'])->group(function () {
    Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
    Route::post('/empresas', [EmpresaController::class, 'store'])->name('empresas.store');
    Route::put('/empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::patch('/empresas/{empresa}/toggle-status', [EmpresaController::class, 'toggleStatus'])->name('empresas.toggle-status');
    Route::post('/empresas/{empresa}/logos', [EmpresaController::class, 'updateLogos'])->name('empresas.logos');
});
