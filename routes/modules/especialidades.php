<?php

use App\Http\Controllers\Admin\EmpresaEspecialidadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'auth'])->group(function () {
    Route::get('/empresas/{empresa}/especialidades', [EmpresaEspecialidadController::class, 'edit'])
        ->name('empresas.especialidades.edit')
        ->can('especialidades.edit');
    Route::put('/empresas/{empresa}/especialidades', [EmpresaEspecialidadController::class, 'update'])
        ->name('empresas.especialidades.update')
        ->can('especialidades.edit');
});
