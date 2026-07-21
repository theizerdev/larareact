<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\VisitaTemporalController;

Route::middleware(['permission:visitas_temporales.view'])->group(function () {
    Route::get('/visitas-temporales', [VisitaTemporalController::class, 'index'])->name('visitas-temporales.index');
});

Route::middleware(['permission:visitas_temporales.create'])->group(function () {
    Route::post('/visitas-temporales', [VisitaTemporalController::class, 'store'])->name('visitas-temporales.store');
    Route::post('/visitas-temporales/pre-registro', [VisitaTemporalController::class, 'generatePreRegistro'])->name('visitas-temporales.pre-registro');
    Route::post('/tipo-servicios', [VisitaTemporalController::class, 'storeTipoServicio'])->name('tipo-servicios.store');
});

Route::middleware(['permission:visitas_temporales.edit'])->group(function () {
    Route::put('/visitas-temporales/{visitaTemporal}', [VisitaTemporalController::class, 'update'])->name('visitas-temporales.update');
    Route::patch('/visitas-temporales/{visitaTemporal}/toggle-status', [VisitaTemporalController::class, 'toggleStatus'])->name('visitas-temporales.toggle-status');
});

Route::middleware(['permission:visitas_temporales.delete'])->group(function () {
    Route::delete('/visitas-temporales/{visitaTemporal}', [VisitaTemporalController::class, 'destroy'])->name('visitas-temporales.destroy');
});
