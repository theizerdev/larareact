<?php

use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:users.view'])->group(function () {
    Route::get('/usuarios', [UserController::class, 'index'])->name('usuarios.index');
});
Route::middleware(['permission:users.create'])->group(function () {
    Route::post('/usuarios', [UserController::class, 'store'])->name('usuarios.store');
});
Route::middleware(['permission:users.edit'])->group(function () {
    Route::put('/usuarios/{user}', [UserController::class, 'update'])->name('usuarios.update');
    Route::patch('/usuarios/{user}/toggle-status', [UserController::class, 'toggleStatus'])->name('usuarios.toggle-status');
});
Route::middleware(['permission:users.delete'])->group(function () {
    Route::delete('/usuarios/{user}', [UserController::class, 'destroy'])->name('usuarios.destroy');
});
