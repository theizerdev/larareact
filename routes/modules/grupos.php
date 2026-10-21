<?php

use App\Http\Controllers\Admin\GroupController;
use Illuminate\Support\Facades\Route;

Route::middleware(['permission:roles.view'])->group(function () {
    Route::get('/grupos', [GroupController::class, 'index'])->name('grupos.index');
});

Route::middleware(['permission:roles.create'])->group(function () {
    Route::post('/grupos', [GroupController::class, 'store'])->name('grupos.store');
});

Route::middleware(['permission:roles.edit'])->group(function () {
    Route::put('/grupos/{grupo}', [GroupController::class, 'update'])->name('grupos.update');
    Route::patch('/grupos/{grupo}/toggle-status', [GroupController::class, 'toggleStatus'])->name('grupos.toggle-status');
});

Route::middleware(['permission:roles.delete'])->group(function () {
    Route::delete('/grupos/{grupo}', [GroupController::class, 'destroy'])->name('grupos.destroy');
});
