<?php

use App\Http\Controllers\Admin\IntegrationController;
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
    Route::get('/integrations/whatsapp/docs', [IntegrationController::class, 'whatsappDocs'])->name('integrations.whatsapp.docs')->can('whatsapp.view');
    Route::get('/integrations/whatsapp/status', [IntegrationController::class, 'whatsappStatus'])->name('integrations.whatsapp.status')->can('whatsapp.view');
    Route::get('/integrations/whatsapp/queue-stats', [IntegrationController::class, 'whatsappQueueStats'])->name('integrations.whatsapp.queue-stats')->can('whatsapp.view');
    Route::put('/integrations/whatsapp/update', [IntegrationController::class, 'whatsappUpdate'])->name('integrations.whatsapp.update')->can('whatsapp.manage');
    Route::post('/integrations/whatsapp/antiban', [IntegrationController::class, 'whatsappUpdateAntiBan'])->name('integrations.whatsapp.antiban')->can('whatsapp.manage');
    Route::post('/integrations/whatsapp/generate-token', [IntegrationController::class, 'whatsappGenerateToken'])->name('integrations.whatsapp.generate-token')->can('integrations.edit');
    Route::post('/integrations/whatsapp/sync', [IntegrationController::class, 'whatsappSync'])->name('integrations.whatsapp.sync')->can('integrations.edit');
    Route::post('/integrations/whatsapp/connect', [IntegrationController::class, 'whatsappConnect'])->name('integrations.whatsapp.connect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/disconnect', [IntegrationController::class, 'whatsappDisconnect'])->name('integrations.whatsapp.disconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/reconnect', [IntegrationController::class, 'whatsappReconnect'])->name('integrations.whatsapp.reconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/send-message', [IntegrationController::class, 'whatsappSendMessage'])->name('integrations.whatsapp.send-message')->can('integrations.edit');
    Route::post('/integrations/whatsapp/check-number', [IntegrationController::class, 'whatsappCheckNumber'])->name('integrations.whatsapp.check-number')->can('integrations.edit');
    Route::post('/integrations/whatsapp/preview-spintax', [IntegrationController::class, 'whatsappPreviewSpintax'])->name('integrations.whatsapp.preview-spintax')->can('integrations.edit');
    Route::post('/integrations/whatsapp/blacklist', [IntegrationController::class, 'whatsappAddToBlacklist'])->name('integrations.whatsapp.blacklist.add')->can('integrations.edit');
    Route::delete('/integrations/whatsapp/blacklist/{phone}', [IntegrationController::class, 'whatsappRemoveFromBlacklist'])->name('integrations.whatsapp.blacklist.remove')->can('integrations.edit');
    Route::get('/integrations/whatsapp/diagnostic', [IntegrationController::class, 'whatsappDiagnostic'])->name('integrations.whatsapp.diagnostic')->can('whatsapp.view');
    Route::get('/integrations/whatsapp/messages', [IntegrationController::class, 'whatsappMessages'])->name('integrations.whatsapp.messages')->can('whatsapp.view');
    Route::post('/integrations/whatsapp/messages/{id}/retry', [IntegrationController::class, 'whatsappRetryMessage'])->name('integrations.whatsapp.messages.retry')->can('integrations.edit');

    // WhatsApp Templates CRUD
    Route::post('/integrations/whatsapp/templates', [IntegrationController::class, 'whatsappTemplatesStore'])->name('integrations.whatsapp.templates.store')->can('integrations.edit');
    Route::put('/integrations/whatsapp/templates/{id}', [IntegrationController::class, 'whatsappTemplatesUpdate'])->name('integrations.whatsapp.templates.update')->can('integrations.edit');
    Route::delete('/integrations/whatsapp/templates/{id}', [IntegrationController::class, 'whatsappTemplatesDestroy'])->name('integrations.whatsapp.templates.destroy')->can('integrations.edit');

    // WhatsApp Broadcasts (Difusión Masiva)
    Route::get('/integrations/whatsapp/broadcast/recipients', [IntegrationController::class, 'whatsappBroadcastRecipients'])->name('integrations.whatsapp.broadcast.recipients')->can('whatsapp.view');
    Route::post('/integrations/whatsapp/broadcast/send', [IntegrationController::class, 'whatsappBroadcastSend'])->name('integrations.whatsapp.broadcast.send')->can('integrations.edit');


    // JAAK (Validaciones) Integration Routes
    Route::get('/integrations/validaciones', [IntegrationController::class, 'validacionesIndex'])->name('integrations.validaciones.index')->can('jaak.view');
    Route::put('/integrations/jaak', [IntegrationController::class, 'updateJaak'])->name('integrations.jaak.update')->can('jaak.manage');
    Route::post('/integrations/jaak/test', [IntegrationController::class, 'jaakTest'])->name('integrations.jaak.test')->can('jaak.manage');
});
