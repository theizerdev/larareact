<?php

use App\Http\Controllers\Admin\AsistenciaReporteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Bitacora de Marcajes
    Route::get('/asistencia/bitacora', [AsistenciaReporteController::class, 'bitacoraMarcajes'])
        ->middleware('permission:asistencia.bitacora|asistencia.view')
        ->name('asistencia.bitacora.index');

    // Consola de Pre-Nómina y Cálculo de Horas LFT
    Route::get('/asistencia/calculo-nomina', [AsistenciaReporteController::class, 'calculoNomina'])
        ->middleware('permission:asistencia.nomina|asistencia.view')
        ->name('asistencia.calculo-nomina.index');
});
