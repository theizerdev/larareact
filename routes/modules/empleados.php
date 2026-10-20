<?php

use App\Http\Controllers\Admin\EmpleadoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::resource('empleados', EmpleadoController::class)->except(['create', 'edit', 'show']);
    Route::patch('empleados/{empleado}/toggle-status', [EmpleadoController::class, 'toggleStatus'])->name('empleados.toggle-status');
});
