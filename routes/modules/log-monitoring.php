<?php

use App\Http\Controllers\Admin\LogMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/monitoring/logs', [LogMonitoringController::class, 'index'])->name('monitoring.logs.index');
    Route::delete('/monitoring/logs/clear', [LogMonitoringController::class, 'clear'])->name('monitoring.logs.clear');
    Route::get('/monitoring/logs/download', [LogMonitoringController::class, 'download'])->name('monitoring.logs.download');
});
