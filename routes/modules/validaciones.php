<?php

use App\Http\Controllers\Admin\KycValidacionController;
use App\Http\Controllers\Admin\OperacionValidacionController;
use Illuminate\Support\Facades\Route;

/*
 * Módulo Resultados de validaciones — identidad (KYC con JAAK) y documentos a
 * firma (ZapSign) de las altas y pre-registros, agrupados por folio de operación.
 * Vista nativa del sistema, independiente de los paneles de JAAK y ZapSign.
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/validaciones', [KycValidacionController::class, 'index'])
        ->name('validaciones.index')->can('validaciones.view');

    Route::post('/validaciones/{kycValidacion}/reprocesar', [KycValidacionController::class, 'reprocesar'])
        ->name('validaciones.reprocesar')->can('validaciones.manage');

    Route::get('/validaciones/documentos', [OperacionValidacionController::class, 'documentos'])
        ->name('validaciones.documentos')->can('validaciones.view');

    Route::get('/validaciones/operaciones/{operacion}', [OperacionValidacionController::class, 'show'])
        ->name('validaciones.operaciones.show')->can('validaciones.view');
});
