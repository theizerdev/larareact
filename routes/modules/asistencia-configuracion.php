<?php

use App\Http\Controllers\Admin\AsistenciaConfiguracionController;
use Illuminate\Support\Facades\Route;

// Every write route below used to share the same OR'd gate as the read
// route (asistencia.configuracion|asistencia.view), so a "viewer"-only
// account (asistencia.view, meant to be read-only - same as every other
// module's viewer role) could create/edit/delete turnos, días festivos
// and the LFT configuration itself. Confirmed in QA testing (2026-08-21).
// Split so only asistencia.configuracion gates writes, matching the
// view/create/edit/delete split used everywhere else in this app.
Route::middleware(['permission:asistencia.configuracion|asistencia.view'])->group(function () {
    Route::get('/asistencia/configuracion', [AsistenciaConfiguracionController::class, 'index'])
        ->name('asistencia.configuracion.index');
});

Route::middleware(['permission:asistencia.configuracion'])->group(function () {
    // Guardado de parámetros generales LFT
    Route::put('/asistencia/configuracion', [AsistenciaConfiguracionController::class, 'updateConfiguracion'])
        ->name('asistencia.configuracion.update');

    // Gestión de Turnos Laborales
    Route::post('/asistencia/turnos', [AsistenciaConfiguracionController::class, 'storeTurno'])
        ->name('asistencia.turnos.store');
    Route::put('/asistencia/turnos/{turno}', [AsistenciaConfiguracionController::class, 'updateTurno'])
        ->name('asistencia.turnos.update');
    Route::patch('/asistencia/turnos/{turno}/toggle', [AsistenciaConfiguracionController::class, 'toggleTurnoStatus'])
        ->name('asistencia.turnos.toggle');
    Route::delete('/asistencia/turnos/{turno}', [AsistenciaConfiguracionController::class, 'destroyTurno'])
        ->name('asistencia.turnos.destroy');

    // Gestión de Días Festivos
    Route::post('/asistencia/festivos', [AsistenciaConfiguracionController::class, 'storeDiaFestivo'])
        ->name('asistencia.festivos.store');
    Route::put('/asistencia/festivos/{diaFestivo}', [AsistenciaConfiguracionController::class, 'updateDiaFestivo'])
        ->name('asistencia.festivos.update');
    Route::delete('/asistencia/festivos/{diaFestivo}', [AsistenciaConfiguracionController::class, 'destroyDiaFestivo'])
        ->name('asistencia.festivos.destroy');
    Route::post('/asistencia/festivos/precargar-lft', [AsistenciaConfiguracionController::class, 'cargarFestivosOficialesLft'])
        ->name('asistencia.festivos.precargar-lft');
});
