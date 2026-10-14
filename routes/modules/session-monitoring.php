<?php

use App\Http\Controllers\Admin\SessionMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/sessions', [SessionMonitoringController::class, 'index'])->name('monitoring.sessions.index');
    // Cerrar la sesión de otra persona exige el permiso del módulo de accesos.
    Route::delete('/monitoring/sessions/{id}', [SessionMonitoringController::class, 'destroy'])
        ->middleware('permission:monitoreo.logins')
        ->name('monitoring.sessions.destroy');
});
