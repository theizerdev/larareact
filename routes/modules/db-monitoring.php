<?php

use App\Http\Controllers\Admin\DbMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/database', [DbMonitoringController::class, 'index'])->name('monitoring.database.index');
    Route::get('/monitoring/database/tables', [DbMonitoringController::class, 'getTables'])->name('monitoring.database.tables');
    Route::get('/monitoring/database/metrics', [DbMonitoringController::class, 'getMetrics'])->name('monitoring.database.metrics');
    Route::post('/monitoring/database/verify-password', [DbMonitoringController::class, 'verifyPassword'])->name('monitoring.database.verify-password');
    Route::post('/monitoring/database/export', [DbMonitoringController::class, 'export'])->name('monitoring.database.export');
    Route::post('/monitoring/database/import', [DbMonitoringController::class, 'import'])->name('monitoring.database.import');
});
