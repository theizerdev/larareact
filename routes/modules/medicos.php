<?php

use App\Http\Controllers\Admin\MedicoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'auth', 'tenant'])->group(function () {
    Route::get('/medicos', [MedicoController::class, 'index'])
        ->name('medicos.index')
        ->can('medicos.view');

    Route::post('/medicos', [MedicoController::class, 'store'])
        ->name('medicos.store')
        ->can('medicos.create');

    Route::put('/medicos/{medico}', [MedicoController::class, 'update'])
        ->name('medicos.update')
        ->can('medicos.edit');

    Route::patch('/medicos/{medico}/toggle-status', [MedicoController::class, 'toggleStatus'])
        ->name('medicos.toggle-status')
        ->can('medicos.edit');

    Route::post('/medicos/{medico}/send-whatsapp-credentials', [MedicoController::class, 'sendWhatsAppCredentials'])
        ->name('medicos.send-whatsapp-credentials')
        ->can('medicos.view');

    Route::delete('/medicos/{medico}', [MedicoController::class, 'destroy'])
        ->name('medicos.destroy')
        ->can('medicos.delete');
});
