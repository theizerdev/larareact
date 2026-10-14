<?php

use App\Http\Controllers\Admin\TaskMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/tasks', [TaskMonitoringController::class, 'index'])->name('monitoring.tasks.index');
    // Ejecutar una tarea programada es operación del servidor.
    Route::post('/monitoring/tasks/run', [TaskMonitoringController::class, 'run'])
        ->middleware('permission:monitoreo.server')
        ->name('monitoring.tasks.run');
});
