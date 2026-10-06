<?php

use App\Http\Controllers\Admin\EmpresaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:empresas.view'])->group(function () {
    Route::get('/empresas', [EmpresaController::class, 'index'])->name('empresas.index');
});
// Dar de alta empresas y activarlas/desactivarlas es de la plataforma: sólo el
// Super Administrador (un admin de una empresa no administra a las demás).
Route::middleware(['permission:empresas.create', 'superadmin'])->group(function () {
    Route::post('/empresas', [EmpresaController::class, 'store'])->name('empresas.store');
});
Route::middleware(['permission:empresas.edit', 'superadmin'])->group(function () {
    Route::patch('/empresas/{empresa}/toggle-status', [EmpresaController::class, 'toggleStatus'])->name('empresas.toggle-status');
});
Route::middleware(['permission:empresas.edit'])->group(function () {
    Route::put('/empresas/{empresa}', [EmpresaController::class, 'update'])->name('empresas.update');
    Route::post('/empresas/{empresa}/logos', [EmpresaController::class, 'updateLogos'])->name('empresas.logos');
});
