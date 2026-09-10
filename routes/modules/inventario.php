<?php

use App\Http\Controllers\Admin\InventarioEquipoController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('/inventario/equipos', [InventarioEquipoController::class, 'index'])->name('inventario.equipos.index');
    Route::post('/inventario/equipos', [InventarioEquipoController::class, 'store'])->name('inventario.equipos.store');
    Route::put('/inventario/equipos/{equipo}', [InventarioEquipoController::class, 'update'])->name('inventario.equipos.update');
    Route::delete('/inventario/equipos/{equipo}', [InventarioEquipoController::class, 'destroy'])->name('inventario.equipos.destroy');
});

