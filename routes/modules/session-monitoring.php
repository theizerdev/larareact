<?php

use App\Http\Controllers\Admin\SessionMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/monitoring/sessions', [SessionMonitoringController::class, 'index'])->name('monitoring.sessions.index');
    Route::delete('/monitoring/sessions/{id}', [SessionMonitoringController::class, 'destroy'])->name('monitoring.sessions.destroy');
});
