<?php

use App\Http\Controllers\Admin\KycValidacionController;
use Illuminate\Support\Facades\Route;

/*
 * Módulo Validaciones — resultados de validación de identidad (KYC) de las
 * personas registradas. Vista nativa del sistema, independiente del panel de JAAK.
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/validaciones', [KycValidacionController::class, 'index'])
        ->name('validaciones.index')->can('validaciones.view');

    Route::post('/validaciones/{kycValidacion}/reprocesar', [KycValidacionController::class, 'reprocesar'])
        ->name('validaciones.reprocesar')->can('validaciones.manage');
});
