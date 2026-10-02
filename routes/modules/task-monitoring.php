<?php

use App\Http\Controllers\Admin\TaskMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/tasks', [TaskMonitoringController::class, 'index'])->name('monitoring.tasks.index');
    Route::post('/monitoring/tasks/run', [TaskMonitoringController::class, 'run'])->name('monitoring.tasks.run');
});
