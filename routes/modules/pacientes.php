<?php

use App\Http\Controllers\Admin\PacienteController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'auth', 'tenant'])->group(function () {
    Route::get('/pacientes', [PacienteController::class, 'index'])
        ->name('pacientes.index')
        ->can('pacientes.view');

    Route::post('/pacientes', [PacienteController::class, 'store'])
        ->name('pacientes.store')
        ->can('pacientes.create');

    Route::put('/pacientes/{paciente}', [PacienteController::class, 'update'])
        ->name('pacientes.update')
        ->can('pacientes.edit');

    Route::patch('/pacientes/{paciente}/toggle-status', [PacienteController::class, 'toggleStatus'])
        ->name('pacientes.toggle-status')
        ->can('pacientes.edit');

    Route::post('/pacientes/{paciente}/send-whatsapp-welcome', [PacienteController::class, 'sendWhatsAppWelcome'])
        ->name('pacientes.send-whatsapp-welcome')
        ->can('pacientes.view');

    Route::delete('/pacientes/{paciente}', [PacienteController::class, 'destroy'])
        ->name('pacientes.destroy')
        ->can('pacientes.delete');
});
