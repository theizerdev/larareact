<?php

use App\Http\Controllers\Admin\ContpaqiPrenominaController;
use App\Http\Controllers\Admin\IncidenciaEmpleadoController;
use Illuminate\Support\Facades\Route;

/*
 * Nómina: captura de incidencias y salida a CONTPAQi Nóminas.
 *
 * Las lecturas y las escrituras van con permisos distintos, siguiendo la
 * corrección que ya se hizo en asistencia-configuracion.php: un rol de sólo
 * lectura no debe poder capturar incidencias ni generar archivos de nómina.
 *
 * Aprobar tiene su propio permiso, aparte de capturar. Una incidencia aprobada
 * mueve dinero y tapa faltas injustificadas, así que quien la captura no
 * debería poder autorizarla por su cuenta.
 */

Route::middleware(['auth', 'verified'])->group(function () {

    /* ---------------------------------------------------------------- */
    /*  Incidencias */
    /* ---------------------------------------------------------------- */

    Route::middleware('permission:incidencias.view')->group(function () {
        Route::get('/nomina/incidencias', [IncidenciaEmpleadoController::class, 'index'])
            ->name('nomina.incidencias.index');

        // El justificante se ve con el mismo permiso que la incidencia: quien
        // puede revisar la lista tiene que poder abrir la incapacidad que la
        // respalda, o la revisión no sirve de nada.
        Route::get('/nomina/incidencias/{incidencia}/justificante', [IncidenciaEmpleadoController::class, 'justificante'])
            ->name('nomina.incidencias.justificante');
    });

    Route::middleware('permission:incidencias.create')->group(function () {
        Route::post('/nomina/incidencias', [IncidenciaEmpleadoController::class, 'store'])
            ->name('nomina.incidencias.store');
    });

    Route::middleware('permission:incidencias.edit')->group(function () {
        Route::put('/nomina/incidencias/{incidencia}', [IncidenciaEmpleadoController::class, 'update'])
            ->name('nomina.incidencias.update');
    });

    Route::middleware('permission:incidencias.delete')->group(function () {
        Route::delete('/nomina/incidencias/{incidencia}', [IncidenciaEmpleadoController::class, 'destroy'])
            ->name('nomina.incidencias.destroy');
    });

    Route::middleware('permission:incidencias.aprobar')->group(function () {
        Route::patch('/nomina/incidencias/{incidencia}/aprobar', [IncidenciaEmpleadoController::class, 'aprobar'])
            ->name('nomina.incidencias.aprobar');
        Route::patch('/nomina/incidencias/{incidencia}/rechazar', [IncidenciaEmpleadoController::class, 'rechazar'])
            ->name('nomina.incidencias.rechazar');
    });

    /* ---------------------------------------------------------------- */
    /*  Prenómina de CONTPAQi */
    /* ---------------------------------------------------------------- */

    Route::middleware('permission:contpaqi.view')->group(function () {
        // La previsualización del período va en este mismo GET, con ?desde y
        // ?hasta. No escribe nada, así que basta con permiso de lectura:
        // revisar antes de generar es justo lo que se quiere que la gente
        // haga, y ponerle un permiso caro lo desalienta.
        Route::get('/nomina/contpaqi', [ContpaqiPrenominaController::class, 'index'])
            ->name('nomina.contpaqi.index');

        Route::get('/nomina/contpaqi/{exportacion}/descargar', [ContpaqiPrenominaController::class, 'descargar'])
            ->name('nomina.contpaqi.descargar');
    });

    Route::middleware('permission:contpaqi.exportar')->group(function () {
        Route::post('/nomina/contpaqi/generar', [ContpaqiPrenominaController::class, 'generar'])
            ->name('nomina.contpaqi.generar');

        // Trae las últimas checadas del reloj y recalcula el período antes de
        // generar. Escribe en asistencia, por eso no basta con contpaqi.view.
        Route::post('/nomina/contpaqi/sincronizar-reloj', [ContpaqiPrenominaController::class, 'sincronizarReloj'])
            ->name('nomina.contpaqi.sincronizar-reloj');

        // Cerrar va con el permiso de exportar y no con uno propio: quien
        // puede producir el archivo es quien sabe cuál se importó de verdad.
        Route::patch('/nomina/contpaqi/{exportacion}/cerrar', [ContpaqiPrenominaController::class, 'cerrar'])
            ->name('nomina.contpaqi.cerrar');
    });

    /* ---------------------------------------------------------------- */
    /*  Mapeo de códigos de empleado y calendario */
    /* ---------------------------------------------------------------- */

    Route::middleware('permission:contpaqi.catalogo')->group(function () {
        Route::put('/nomina/contpaqi/configuracion', [ContpaqiPrenominaController::class, 'configuracion'])
            ->name('nomina.contpaqi.configuracion');

        Route::get('/nomina/contpaqi/mapeos', [ContpaqiPrenominaController::class, 'mapeos'])
            ->name('nomina.contpaqi.mapeos.index');
        Route::post('/nomina/contpaqi/mapeos', [ContpaqiPrenominaController::class, 'guardarMapeo'])
            ->name('nomina.contpaqi.mapeos.store');
        Route::put('/nomina/contpaqi/mapeos/{mapeo}', [ContpaqiPrenominaController::class, 'actualizarMapeo'])
            ->name('nomina.contpaqi.mapeos.update');
        Route::delete('/nomina/contpaqi/mapeos/{mapeo}', [ContpaqiPrenominaController::class, 'eliminarMapeo'])
            ->name('nomina.contpaqi.mapeos.destroy');
    });
});
