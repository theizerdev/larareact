<?php

use App\Http\Controllers\Admin\QueueMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/monitoring/queues', [QueueMonitoringController::class, 'index'])->name('monitoring.queues.index');
    Route::post('/monitoring/queues/retry-all', [QueueMonitoringController::class, 'retryAll'])->name('monitoring.queues.retry-all');
    Route::post('/monitoring/queues/{id}/retry', [QueueMonitoringController::class, 'retry'])->name('monitoring.queues.retry');
    Route::delete('/monitoring/queues/clear-all', [QueueMonitoringController::class, 'destroyAll'])->name('monitoring.queues.clear-all');
    Route::delete('/monitoring/queues/{id}', [QueueMonitoringController::class, 'destroy'])->name('monitoring.queues.destroy');
});
