<?php

use App\Http\Controllers\Admin\ActivityMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/activity', [ActivityMonitoringController::class, 'index'])->name('monitoring.activity.index');
    Route::get('/monitoring/activity/export', [ActivityMonitoringController::class, 'export'])->name('monitoring.activity.export');
    Route::delete('/monitoring/activity/clear', [ActivityMonitoringController::class, 'clear'])->name('monitoring.activity.clear');
});
