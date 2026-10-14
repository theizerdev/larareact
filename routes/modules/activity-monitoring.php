<?php

use App\Http\Controllers\Admin\ActivityMonitoringController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'permission:monitoreo.view'])->group(function () {
    Route::get('/monitoring/activity', [ActivityMonitoringController::class, 'index'])->name('monitoring.activity.index');
    Route::get('/monitoring/activity/export', [ActivityMonitoringController::class, 'export'])->name('monitoring.activity.export');
    // Vaciar la bitácora de auditoría no es "ver": exige el permiso del módulo
    // (antes bastaba monitoreo.view, que tiene el rol de solo lectura).
    Route::delete('/monitoring/activity/clear', [ActivityMonitoringController::class, 'clear'])
        ->middleware('permission:monitoreo.activities')
        ->name('monitoring.activity.clear');
});
