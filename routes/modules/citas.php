<?php

use App\Http\Controllers\Admin\CitaController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified', 'auth', 'tenant'])->group(function () {
    Route::get('/citas', [CitaController::class, 'index'])
        ->name('citas.index')
        ->can('citas.view');

    Route::get('/citas/slots', [CitaController::class, 'getSlots'])
        ->name('citas.slots')
        ->can('citas.view');

    Route::post('/citas', [CitaController::class, 'store'])
        ->name('citas.store')
        ->can('citas.create');

    Route::put('/citas/{cita}', [CitaController::class, 'update'])
        ->name('citas.update')
        ->can('citas.edit');

    Route::patch('/citas/{cita}/mover', [CitaController::class, 'move'])
        ->name('citas.mover')
        ->can('citas.edit');

    Route::patch('/citas/{cita}/estado', [CitaController::class, 'updateEstado'])
        ->name('citas.update-estado')
        ->can('citas.cambiar_estado');

    Route::delete('/citas/{cita}', [CitaController::class, 'destroy'])
        ->name('citas.destroy')
        ->can('citas.delete');

    Route::post('/citas/{cita}/send-whatsapp-reminder', [CitaController::class, 'sendWhatsAppRecordatorio'])
        ->name('citas.send-whatsapp-reminder')
        ->can('citas.edit');

    // Rutas de Cuestionarios y Plantillas de Pre-Consulta
    Route::post('/citas/{cita}/generar-preconsulta', [\App\Http\Controllers\Admin\PreconsultaAdminController::class, 'generarLinkCita'])
        ->name('citas.generar-preconsulta')
        ->can('citas.edit');

    Route::resource('/plantillas-preconsulta', \App\Http\Controllers\Admin\PreconsultaAdminController::class)
        ->names('plantillas-preconsulta');

    // Tablero Kanban Clínico Unificado de Consultas Médicas
    Route::get('/consultas', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'index'])
        ->name('consultas.index')
        ->can('citas.view');

    // Rutas por estado para acceso directo desde el sidebar
    Route::get('/consultas/sala-de-espera', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'salaDeEspera'])
        ->name('consultas.sala-de-espera')
        ->can('citas.view');

    Route::get('/consultas/en-consultorio', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'enConsultorio'])
        ->name('consultas.en-consultorio')
        ->can('citas.view');

    Route::get('/consultas/finalizadas', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'finalizadas'])
        ->name('consultas.finalizadas')
        ->can('citas.view');



    // Rutas de Consulta Médica (Wizard de Atención) bajo /consultas/{cita}/atencion
    Route::get('/consultas/{cita}/atencion', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'atencion'])
        ->name('consultas.atencion')
        ->can('citas.edit');

    Route::post('/consultas/{cita}/atencion', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'store'])
        ->name('consultas.atencion.store')
        ->can('citas.edit');

    // Crear nuevo Diagnóstico CIE-10
    Route::post('/consultas/cie10', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'storeDiagnosticoCie10'])
        ->name('consultas.cie10.store')
        ->can('citas.edit');

    // Registrar nuevo Estudio en Catálogo de Sugerencias
    Route::post('/consultas/estudios-catalogo', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'storeEstudioCatalogo'])
        ->name('consultas.estudios-catalogo.store')
        ->can('citas.edit');

    // Rutas de impresión de documentos clínicos
    Route::get('/consultas/{consulta}/imprimir/informe', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'imprimirInforme'])
        ->name('consultas.imprimir.informe')
        ->can('citas.view');

    Route::get('/consultas/{consulta}/imprimir/receta', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'imprimirReceta'])
        ->name('consultas.imprimir.receta')
        ->can('citas.view');

    Route::get('/consultas/{consulta}/imprimir/estudios', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'imprimirEstudios'])
        ->name('consultas.imprimir.estudios')
        ->can('citas.view');

    Route::get('/consultas/{consulta}/imprimir/reposo', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'imprimirReposo'])
        ->name('consultas.imprimir.reposo')
        ->can('citas.view');

    Route::get('/consultas/{consulta}/imprimir/constancia', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'imprimirConstancia'])
        ->name('consultas.imprimir.constancia')
        ->can('citas.view');

    // Rutas de compatibilidad /citas/{cita}/atencion
    Route::get('/citas/{cita}/atencion', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'atencion'])
        ->name('citas.atencion')
        ->can('citas.edit');

    Route::post('/citas/{cita}/atencion', [\App\Http\Controllers\Admin\ConsultaMedicaController::class, 'store'])
        ->name('citas.atencion.store')
        ->can('citas.edit');
});





