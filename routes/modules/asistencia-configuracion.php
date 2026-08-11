<?php

use App\Http\Controllers\Admin\AsistenciaConfiguracionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'permission:asistencia.configuracion|asistencia.view'])->group(function () {
    // Vista principal de configuración de asistencia
    Route::get('/asistencia/configuracion', [AsistenciaConfiguracionController::class, 'index'])
        ->name('asistencia.configuracion.index');

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
