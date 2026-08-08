<?php

use App\Http\Controllers\Admin\ContabilidadController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    Route::get('contabilidad/setup', [ContabilidadController::class, 'setupIndex'])
        ->name('contabilidad.setup')
        ->middleware('permission:contabilidad.setup');

    Route::post('contabilidad/setup', [ContabilidadController::class, 'setupStore'])
        ->name('contabilidad.setup.store')
        ->middleware('permission:contabilidad.setup');

    Route::get('contabilidad/plan-cuentas', [ContabilidadController::class, 'planCuentas'])
        ->name('contabilidad.plan-cuentas')
        ->middleware('permission:contabilidad.plan_cuentas');

    Route::post('contabilidad/plan-cuentas', [ContabilidadController::class, 'storeCuenta'])
        ->name('contabilidad.plan-cuentas.store')
        ->middleware('permission:contabilidad.plan_cuentas');

    Route::get('contabilidad/asientos', [ContabilidadController::class, 'asientos'])
        ->name('contabilidad.asientos')
        ->middleware('permission:contabilidad.asientos');

    Route::post('contabilidad/asientos', [ContabilidadController::class, 'storeAsientoManual'])
        ->name('contabilidad.asientos.store')
        ->middleware('permission:contabilidad.asientos');

    Route::get('contabilidad/mayor', [ContabilidadController::class, 'mayor'])
        ->name('contabilidad.mayor')
        ->middleware('permission:contabilidad.mayor');

    Route::get('contabilidad/reportes', [ContabilidadController::class, 'reportes'])
        ->name('contabilidad.reportes')
        ->middleware('permission:contabilidad.reportes');

    Route::get('contabilidad/impuestos', [ContabilidadController::class, 'impuestos'])
        ->name('contabilidad.impuestos')
        ->middleware('permission:contabilidad.impuestos');

    Route::post('contabilidad/cierre-ejercicio', [ContabilidadController::class, 'cierreEjercicio'])
        ->name('contabilidad.cierre-ejercicio')
        ->middleware('permission:contabilidad.reportes');

    Route::get('contabilidad/exportar-excel', [ContabilidadController::class, 'exportarExcelCompleto'])
        ->name('contabilidad.exportar-excel')
        ->middleware('permission:contabilidad.reportes');
});

