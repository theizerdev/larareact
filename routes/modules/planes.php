<?php

use App\Http\Controllers\Admin\PlanFinanciamientoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/planes-financiamiento', [PlanFinanciamientoController::class, 'index'])->name('planes.index');
    Route::post('/planes-financiamiento', [PlanFinanciamientoController::class, 'store'])->name('planes.store');
    Route::put('/planes-financiamiento/{plan}', [PlanFinanciamientoController::class, 'update'])->name('planes.update');
    Route::patch('/planes-financiamiento/{plan}/toggle-status', [PlanFinanciamientoController::class, 'toggleStatus'])->name('planes.toggle-status');
    Route::delete('/planes-financiamiento/{plan}', [PlanFinanciamientoController::class, 'destroy'])->name('planes.destroy');
});

