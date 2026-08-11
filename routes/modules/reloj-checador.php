<?php

use App\Http\Controllers\Admin\RelojChecadorKioskoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'permission:asistencia.kiosko|asistencia.view'])->group(function () {
    Route::get('/reloj-checador/kiosko', [RelojChecadorKioskoController::class, 'kioskoView'])
        ->name('reloj-checador.kiosko');

    Route::post('/api/reloj-checador/buscar', [RelojChecadorKioskoController::class, 'buscarEmpleado'])
        ->name('api.reloj-checador.buscar');

    Route::post('/api/reloj-checador/registrar', [RelojChecadorKioskoController::class, 'registrarMarcaje'])
        ->name('api.reloj-checador.registrar');
});
