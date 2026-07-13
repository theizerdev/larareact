<?php

use App\Http\Controllers\Admin\ServerMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/monitoring/server', [ServerMonitoringController::class, 'index'])->name('monitoring.server.index');
    Route::get('/monitoring/server/metrics', [ServerMonitoringController::class, 'getMetrics'])->name('monitoring.server.metrics');
});
