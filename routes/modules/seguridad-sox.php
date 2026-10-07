<?php

use App\Http\Controllers\Admin\SoxComplianceController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('seguridad')->name('seguridad.')->group(function () {
    Route::get('/sox', [SoxComplianceController::class, 'index'])->name('sox.index');
    Route::put('/sox/settings', [SoxComplianceController::class, 'updateSettings'])->name('sox.settings.update');
    Route::post('/sox/users/{user}/unlock', [SoxComplianceController::class, 'unlockUser'])->name('sox.users.unlock');
    Route::post('/sox/users/{user}/force-reset', [SoxComplianceController::class, 'forcePasswordReset'])->name('sox.users.force-reset');
});
