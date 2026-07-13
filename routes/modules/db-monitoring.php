<?php

use App\Http\Controllers\Admin\DbMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/monitoring/database', [DbMonitoringController::class, 'index'])->name('monitoring.database.index');
    Route::get('/monitoring/database/metrics', [DbMonitoringController::class, 'getMetrics'])->name('monitoring.database.metrics');
});
