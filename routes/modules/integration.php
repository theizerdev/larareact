<?php

use App\Http\Controllers\Admin\IntegrationController;
use App\Http\Controllers\Admin\KycValidacionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index')->can('integrations.view');
    Route::get('/integrations/map', [IntegrationController::class, 'mapboxMap'])->name('integrations.mapbox.map')->can('integrations.view');
    Route::get('/integrations/map/navigation', [IntegrationController::class, 'mapboxNavigation'])->name('integrations.mapbox.navigation')->can('integrations.view');
    Route::put('/integrations/mapbox', [IntegrationController::class, 'updateMapbox'])->name('integrations.mapbox.update')->can('integrations.edit');
    Route::put('/integrations/google-maps', [IntegrationController::class, 'updateGoogleMaps'])->name('integrations.google-maps.update')->can('integrations.edit');
    Route::put('/integrations/control-acceso', [IntegrationController::class, 'updateControlAcceso'])->name('integrations.control-acceso.update')->can('integrations.edit');
    Route::post('/integrations/control-acceso/test', [IntegrationController::class, 'controlAccesoTest'])->name('integrations.control-acceso.test')->can('integrations.edit');

    // WhatsApp Integration Routes
    Route::get('/integrations/whatsapp', [IntegrationController::class, 'whatsappIndex'])->name('integrations.whatsapp.index')->can('whatsapp.view');
    Route::get('/integrations/whatsapp/status', [IntegrationController::class, 'whatsappStatus'])->name('integrations.whatsapp.status')->can('whatsapp.view');
    Route::put('/integrations/whatsapp/update', [IntegrationController::class, 'whatsappUpdate'])->name('integrations.whatsapp.update')->can('whatsapp.manage');
    Route::post('/integrations/whatsapp/generate-token', [IntegrationController::class, 'whatsappGenerateToken'])->name('integrations.whatsapp.generate-token')->can('integrations.edit');
    Route::post('/integrations/whatsapp/sync', [IntegrationController::class, 'whatsappSync'])->name('integrations.whatsapp.sync')->can('integrations.edit');
    Route::post('/integrations/whatsapp/connect', [IntegrationController::class, 'whatsappConnect'])->name('integrations.whatsapp.connect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/disconnect', [IntegrationController::class, 'whatsappDisconnect'])->name('integrations.whatsapp.disconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/reconnect', [IntegrationController::class, 'whatsappReconnect'])->name('integrations.whatsapp.reconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/send-message', [IntegrationController::class, 'whatsappSendMessage'])->name('integrations.whatsapp.send-message')->can('integrations.edit');

    // JAAK (Validaciones) Integration Routes
    Route::get('/integrations/validaciones', [IntegrationController::class, 'validacionesIndex'])->name('integrations.validaciones.index')->can('jaak.view');
    Route::put('/integrations/jaak', [IntegrationController::class, 'updateJaak'])->name('integrations.jaak.update')->can('jaak.manage');
    Route::post('/integrations/jaak/test', [IntegrationController::class, 'jaakTest'])->name('integrations.jaak.test')->can('jaak.manage');

    // Resultados de validación de identidad (KYC) de las personas
    Route::get('/integrations/kyc', [KycValidacionController::class, 'index'])->name('integrations.kyc.index')->can('kyc.view');
    Route::post('/integrations/kyc/{kycValidacion}/reprocesar', [KycValidacionController::class, 'reprocesar'])->name('integrations.kyc.reprocesar')->can('kyc.manage');
});
