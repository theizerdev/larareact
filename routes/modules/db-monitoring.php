<?php

use App\Http\Controllers\Admin\DbMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/monitoring/database', [DbMonitoringController::class, 'index'])->name('monitoring.database.index');
    Route::get('/monitoring/database/metrics', [DbMonitoringController::class, 'getMetrics'])->name('monitoring.database.metrics');
    Route::post('/monitoring/database/export/preview', [DbMonitoringController::class, 'exportPreview'])->name('monitoring.database.export.preview');
    Route::post('/monitoring/database/export/confirm-password', [DbMonitoringController::class, 'confirmPassword'])->name('monitoring.database.export.confirm-password');
    Route::post('/monitoring/database/export/download', [DbMonitoringController::class, 'downloadExport'])->name('monitoring.database.export.download');
});
