<?php

use App\Http\Controllers\Admin\SoxComplianceController;
use Illuminate\Support\Facades\Route;

// Antes solo exigía sesión: cualquier usuario autenticado podía ver la consola,
// cambiar las políticas y desbloquear/forzar renovación a otros usuarios.
// Se alinea con el menú (que ya exige users.view) y con el módulo de usuarios
// (users.edit para desbloquear).
Route::middleware(['auth', 'verified'])->prefix('seguridad')->name('seguridad.')->group(function () {
    Route::middleware('permission:users.view')->group(function () {
        Route::get('/sox', [SoxComplianceController::class, 'index'])->name('sox.index');
    });

    Route::middleware('permission:users.edit')->group(function () {
        Route::put('/sox/settings', [SoxComplianceController::class, 'updateSettings'])->name('sox.settings.update');
        Route::post('/sox/users/{user}/unlock', [SoxComplianceController::class, 'unlockUser'])->name('sox.users.unlock');
        Route::post('/sox/users/{user}/force-reset', [SoxComplianceController::class, 'forcePasswordReset'])->name('sox.users.force-reset');
    });
});
