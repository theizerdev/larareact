<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\DepartamentoController;

Route::middleware(['permission:departamentos.view'])->group(function () {
    Route::get('/departamentos', [DepartamentoController::class, 'index'])->name('departamentos.index');
});
Route::middleware(['permission:departamentos.create'])->group(function () {
    Route::post('/departamentos', [DepartamentoController::class, 'store'])->name('departamentos.store');
});
Route::middleware(['permission:departamentos.edit'])->group(function () {
    Route::put('/departamentos/{departamento}', [DepartamentoController::class, 'update'])->name('departamentos.update');
    Route::patch('/departamentos/{departamento}/toggle-status', [DepartamentoController::class, 'toggleStatus'])->name('departamentos.toggle-status');
});
Route::middleware(['permission:departamentos.delete'])->group(function () {
    Route::delete('/departamentos/{departamento}', [DepartamentoController::class, 'destroy'])->name('departamentos.destroy');
});
