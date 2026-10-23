<?php

use App\Http\Controllers\Admin\RelojEquipoBiometricoController;
use App\Http\Controllers\Admin\RelojUbicacionController;
use Illuminate\Support\Facades\Route;

// Lectura de los módulos de Ubicaciones (Pestaña 3) y Biométricos Setup (Pestaña 2)
Route::middleware(['permission:asistencia.configuracion|asistencia.view|asistencia.bitacora'])->group(function () {
    Route::get('/asistencia/ubicaciones', [RelojUbicacionController::class, 'index'])
        ->name('asistencia.ubicaciones.index');

    Route::get('/asistencia/biometricos-setup', [RelojEquipoBiometricoController::class, 'index'])
        ->name('asistencia.biometricos-setup.index');
});

// Escritura e Importación Masiva (con separación automática de datos entre Ubicaciones y Biométricos Setup)
Route::middleware(['permission:asistencia.configuracion'])->group(function () {
    // CRUD Ubicaciones (Pestaña 3)
    Route::post('/asistencia/ubicaciones', [RelojUbicacionController::class, 'store'])
        ->name('asistencia.ubicaciones.store');
    Route::put('/asistencia/ubicaciones/{ubicacion}', [RelojUbicacionController::class, 'update'])
        ->name('asistencia.ubicaciones.update');
    Route::patch('/asistencia/ubicaciones/{ubicacion}/toggle-status', [RelojUbicacionController::class, 'toggleStatus'])
        ->name('asistencia.ubicaciones.toggle-status');
    Route::delete('/asistencia/ubicaciones/{ubicacion}', [RelojUbicacionController::class, 'destroy'])
        ->name('asistencia.ubicaciones.destroy');

    // CRUD Biométricos Setup (Pestaña 2)
    Route::post('/asistencia/biometricos-setup', [RelojEquipoBiometricoController::class, 'store'])
        ->name('asistencia.biometricos-setup.store');
    Route::put('/asistencia/biometricos-setup/{biometrico}', [RelojEquipoBiometricoController::class, 'update'])
        ->name('asistencia.biometricos-setup.update');
    Route::patch('/asistencia/biometricos-setup/{biometrico}/toggle-status', [RelojEquipoBiometricoController::class, 'toggleStatus'])
        ->name('asistencia.biometricos-setup.toggle-status');
    Route::delete('/asistencia/biometricos-setup/{biometrico}', [RelojEquipoBiometricoController::class, 'destroy'])
        ->name('asistencia.biometricos-setup.destroy');

    // Motor de Importación Masiva Unificado (separa automáticamente Ubicaciones (2) y Biométricos setup)
    Route::post('/asistencia/equipos-ubicaciones/importar/preview', [RelojUbicacionController::class, 'previewImport'])
        ->name('asistencia.equipos-ubicaciones.import.preview');
    Route::post('/asistencia/equipos-ubicaciones/importar', [RelojUbicacionController::class, 'import'])
        ->name('asistencia.equipos-ubicaciones.import');
});
