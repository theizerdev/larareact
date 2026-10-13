<?php

use App\Http\Controllers\Admin\SoxComplianceController;
use Illuminate\Support\Facades\Route;

// Requiere sesión y permisos: soporta permisos específicos SOX (sox.view / sox.manage)
// o los permisos heredados (users.view / users.edit) para compatibilidad total y Segregation of Duties.
Route::middleware(['auth', 'verified'])->prefix('seguridad')->name('seguridad.')->group(function () {
    Route::middleware('permission:sox.view|users.view')->group(function () {
        Route::get('/sox', [SoxComplianceController::class, 'index'])->name('sox.index');
    });

    Route::middleware('permission:sox.manage|users.edit')->group(function () {
        Route::put('/sox/settings', [SoxComplianceController::class, 'updateSettings'])->name('sox.settings.update');
        Route::post('/sox/users/{user}/unlock', [SoxComplianceController::class, 'unlockUser'])->name('sox.users.unlock');
        Route::post('/sox/users/{user}/force-reset', [SoxComplianceController::class, 'forcePasswordReset'])->name('sox.users.force-reset');
    });
});
