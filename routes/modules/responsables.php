<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\ResponsableController;

Route::middleware(['permission:responsables.view'])->group(function () {
    Route::get('/responsables', [ResponsableController::class, 'index'])->name('responsables.index');
});

Route::middleware(['permission:responsables.create'])->group(function () {
    Route::post('/responsables', [ResponsableController::class, 'store'])->name('responsables.store');
});

Route::middleware(['permission:responsables.edit'])->group(function () {
    Route::put('/responsables/{responsable}', [ResponsableController::class, 'update'])->name('responsables.update');
    Route::patch('/responsables/{responsable}/toggle-status', [ResponsableController::class, 'toggleStatus'])->name('responsables.toggle-status');
});

Route::middleware(['permission:responsables.delete'])->group(function () {
    Route::delete('/responsables/{responsable}', [ResponsableController::class, 'destroy'])->name('responsables.destroy');
});
