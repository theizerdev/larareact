<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\EmpleadoController;

Route::middleware(['permission:empleados.view'])->group(function () {
    Route::get('/empleados', [EmpleadoController::class, 'index'])->name('empleados.index');
    Route::get('/empleados/{empleado}/carnet', [EmpleadoController::class, 'carnet'])->name('empleados.carnet');
    Route::post('/empleados/{empleado}/enviar-carnet', [EmpleadoController::class, 'enviarCarnetWhatsApp'])->name('empleados.enviar-carnet');
    Route::post('/empleados/validar-curp', [EmpleadoController::class, 'validarCurpRenapo'])->name('empleados.validar-curp');
});

Route::middleware(['permission:empleados.create'])->group(function () {
    Route::post('/empleados', [EmpleadoController::class, 'store'])->name('empleados.store');
    Route::post('/empleados/pre-registro', [EmpleadoController::class, 'generatePreRegistro'])->name('empleados.pre-registro');
});

Route::middleware(['permission:empleados.import|empleados.create'])->group(function () {
    Route::post('/empleados/import-preview', [EmpleadoController::class, 'importPreview'])->name('empleados.import-preview');
    Route::post('/empleados/import-verify-password', [EmpleadoController::class, 'verifyPassword'])->name('empleados.import-verify-password');
    Route::post('/empleados/import-execute', [EmpleadoController::class, 'importExecute'])->name('empleados.import-execute');
});

Route::middleware(['permission:empleados.edit'])->group(function () {
    Route::put('/empleados/{empleado}', [EmpleadoController::class, 'update'])->name('empleados.update');
    Route::patch('/empleados/{empleado}/toggle-status', [EmpleadoController::class, 'toggleStatus'])->name('empleados.toggle-status');
});

Route::middleware(['permission:empleados.delete'])->group(function () {
    Route::delete('/empleados/{empleado}', [EmpleadoController::class, 'destroy'])->name('empleados.destroy');
});
