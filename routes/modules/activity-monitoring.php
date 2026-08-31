<?php

use App\Http\Controllers\Admin\ActivityMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/monitoring/activities', [ActivityMonitoringController::class, 'index'])->name('monitoring.activities.index');
    Route::get('/monitoring/activities/export', [ActivityMonitoringController::class, 'export'])->name('monitoring.activities.export');
    Route::delete('/monitoring/activities/clear', [ActivityMonitoringController::class, 'clear'])->name('monitoring.activities.clear');
    Route::delete('/monitoring/activities/{id}', [ActivityMonitoringController::class, 'destroy'])->name('monitoring.activities.destroy');
});
