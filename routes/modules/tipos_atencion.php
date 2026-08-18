<?php

use App\Http\Controllers\Admin\TipoAtencionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'auth', 'tenant'])->group(function () {
    Route::get('/tipos-atencion', [TipoAtencionController::class, 'index'])
        ->name('tipos-atencion.index')
        ->can('tipos_atencion.view');

    Route::post('/tipos-atencion', [TipoAtencionController::class, 'store'])
        ->name('tipos-atencion.store')
        ->can('tipos_atencion.create');

    Route::put('/tipos-atencion/{tipoAtencion}', [TipoAtencionController::class, 'update'])
        ->name('tipos-atencion.update')
        ->can('tipos_atencion.edit');

    Route::patch('/tipos-atencion/{tipoAtencion}/toggle-status', [TipoAtencionController::class, 'toggleStatus'])
        ->name('tipos-atencion.toggle-status')
        ->can('tipos_atencion.edit');

    Route::delete('/tipos-atencion/{tipoAtencion}', [TipoAtencionController::class, 'destroy'])
        ->name('tipos-atencion.destroy')
        ->can('tipos_atencion.delete');
});
