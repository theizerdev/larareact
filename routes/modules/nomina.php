<?php

use App\Http\Controllers\Admin\NominaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('nomina', [NominaController::class, 'index'])
        ->name('nomina.index')
        ->middleware('permission:nomina.view');

    Route::post('nomina/generar', [NominaController::class, 'generar'])
        ->name('nomina.generar')
        ->middleware('permission:nomina.create');

    Route::put('nomina/detalles/{detalle}', [NominaController::class, 'updateDetalle'])
        ->name('nomina.detalles.update')
        ->middleware('permission:nomina.edit');

    Route::post('nomina/{nomina}/cerrar', [NominaController::class, 'cerrar'])
        ->name('nomina.cerrar')
        ->middleware('permission:nomina.close');

    Route::post('nomina/detalles/{detalle}/pagar', [NominaController::class, 'pagarDetalle'])
        ->name('nomina.detalles.pagar')
        ->middleware('permission:nomina.pay');
});
