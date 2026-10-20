<?php

use App\Http\Controllers\Admin\EmpleadoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::post('empleados/sync-users', [EmpleadoController::class, 'syncUsers'])->name('empleados.sync-users');
    Route::resource('empleados', EmpleadoController::class)->except(['create', 'edit', 'show']);
    Route::patch('empleados/{empleado}/toggle-status', [EmpleadoController::class, 'toggleStatus'])->name('empleados.toggle-status');
});

