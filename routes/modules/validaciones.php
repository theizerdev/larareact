<?php

use App\Http\Controllers\Admin\KycValidacionController;
use App\Http\Controllers\Admin\OperacionValidacionController;
use App\Http\Controllers\Admin\PrevalidacionController;
use App\Http\Controllers\Admin\ValidarPersonaController;
use Illuminate\Support\Facades\Route;

/*
 * Módulo Resultados de validaciones — identidad (KYC con JAAK) y documentos a
 * firma (ZapSign) de las altas y pre-registros, agrupados por folio de operación.
 * Vista nativa del sistema, independiente de los paneles de JAAK y ZapSign.
 */
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/validaciones', [KycValidacionController::class, 'index'])
        ->name('validaciones.index')->can('validaciones.view');

    Route::post('/validaciones/{kycValidacion}/reprocesar', [KycValidacionController::class, 'reprocesar'])
        ->name('validaciones.reprocesar')->can('validaciones.manage');

    Route::get('/validaciones/documentos', [OperacionValidacionController::class, 'documentos'])
        ->name('validaciones.documentos')->can('validaciones.view');

    Route::post('/validaciones/documentos/{firmaDocumento}/consultar', [OperacionValidacionController::class, 'consultarFirma'])
        ->name('validaciones.documentos.consultar')->can('validaciones.manage');

    Route::post('/validaciones/documentos/{firmaDocumento}/cancelar', [OperacionValidacionController::class, 'cancelarFirma'])
        ->name('validaciones.documentos.cancelar')->can('validaciones.manage');

    Route::get('/validaciones/documentos/{firmaDocumento}/pdf', [OperacionValidacionController::class, 'descargarPdf'])
        ->name('validaciones.documentos.pdf')->can('validaciones.view');

    // Botón "Validar" de los listados (colaboradores, proveedores, socios, visitas temporales).
    Route::post('/validaciones/validar/{tipo}/{id}', ValidarPersonaController::class)
        ->whereNumber('id')->name('validaciones.validar')->can('validaciones.manage')
        ->middleware('throttle:20,1');

    // Camino que seguiría la validación automática (vista previa del submenú).
    Route::get('/validaciones/ruta/{tipo}/{id}', [ValidarPersonaController::class, 'ruta'])
        ->whereNumber('id')->name('validaciones.ruta')->can('validaciones.manage')
        ->middleware('throttle:60,1');

    // Botón "Validar" dentro del formulario de alta (antes de guardar): RFC de la
    // empresa (TRUORA) y nombre + CURP de la persona (DIDIT → RENAPO).
    Route::post('/validaciones/previa/rfc', [PrevalidacionController::class, 'rfc'])
        ->name('validaciones.previa.rfc')->can('validaciones.manage')->middleware('throttle:20,1');

    Route::post('/validaciones/previa/curp', [PrevalidacionController::class, 'curp'])
        ->name('validaciones.previa.curp')->can('validaciones.manage')->middleware('throttle:20,1');

    Route::get('/validaciones/previa/{prevalidacion}', [PrevalidacionController::class, 'show'])
        ->whereNumber('prevalidacion')->name('validaciones.previa.show')->can('validaciones.manage');

    Route::get('/validaciones/operaciones/{operacion}', [OperacionValidacionController::class, 'show'])
        ->name('validaciones.operaciones.show')->can('validaciones.view');
});
