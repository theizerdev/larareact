<?php

use App\Http\Controllers\Admin\ControlAccesoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/control-acceso/empleados', [ControlAccesoController::class, 'empleados'])->name('control-acceso.empleados')->can('control_acceso.view');
    Route::get('/control-acceso/vehiculos', [ControlAccesoController::class, 'vehiculos'])->name('control-acceso.vehiculos')->can('control_acceso.view');
    Route::get('/control-acceso/tarjetas', [ControlAccesoController::class, 'tarjetas'])->name('control-acceso.tarjetas')->can('control_acceso.view');
    Route::get('/control-acceso/eventos-peatonales', [ControlAccesoController::class, 'eventosPeatonales'])->name('control-acceso.eventos-peatonales')->can('control_acceso.view');
    Route::get('/control-acceso/eventos-vehiculares', [ControlAccesoController::class, 'eventosVehiculares'])->name('control-acceso.eventos-vehiculares')->can('control_acceso.view');
    Route::get('/control-acceso/eventos-peatonales/{eventId}/foto', [ControlAccesoController::class, 'eventoPeatonalFoto'])->name('control-acceso.eventos-peatonales.foto')->can('control_acceso.view');
    Route::get('/control-acceso/eventos-vehiculares/{eventId}/foto/{index}', [ControlAccesoController::class, 'eventoVehicularFoto'])->name('control-acceso.eventos-vehiculares.foto')->can('control_acceso.view');
});
