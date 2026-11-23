<?php

use App\Http\Controllers\Admin\IntegrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index')->can('integrations.access');
    Route::get('/integrations/map', [IntegrationController::class, 'mapboxMap'])->name('integrations.mapbox.map')->can('integrations.view');
    Route::get('/integrations/map/navigation', [IntegrationController::class, 'mapboxNavigation'])->name('integrations.mapbox.navigation')->can('integrations.view');
    Route::put('/integrations/mapbox', [IntegrationController::class, 'updateMapbox'])->name('integrations.mapbox.update')->can('integrations.edit');
    Route::put('/integrations/google-maps', [IntegrationController::class, 'updateGoogleMaps'])->name('integrations.google-maps.update')->can('integrations.edit');
    Route::put('/integrations/control-acceso', [IntegrationController::class, 'updateControlAcceso'])->name('integrations.control-acceso.update')->can('integrations.edit');
    Route::post('/integrations/control-acceso/test', [IntegrationController::class, 'controlAccesoTest'])->name('integrations.control-acceso.test')->can('integrations.edit');

    // Pasarelas de Pago Globales (SaaS & Suscripciones)
    Route::put('/integrations/stripe', [IntegrationController::class, 'updateStripe'])->name('integrations.stripe.update')->can('integrations.edit');
    Route::post('/integrations/stripe/test', [IntegrationController::class, 'testStripe'])->name('integrations.stripe.test')->can('integrations.edit');
    Route::put('/integrations/paypal', [IntegrationController::class, 'updatePaypal'])->name('integrations.paypal.update')->can('integrations.edit');
    Route::put('/integrations/mercadopago', [IntegrationController::class, 'updateMercadoPago'])->name('integrations.mercadopago.update')->can('integrations.edit');
    Route::put('/integrations/primary-gateway', [IntegrationController::class, 'setPrimaryPaymentGateway'])->name('integrations.primary-gateway.update')->can('integrations.edit');

    // WhatsApp Native Python Multi-Sucursal Routes
    Route::get('/integrations/whatsapp', [IntegrationController::class, 'whatsappIndex'])->name('integrations.whatsapp.index')->can('whatsapp.access');
    Route::get('/integrations/whatsapp/docs', [IntegrationController::class, 'whatsappDocs'])->name('integrations.whatsapp.docs')->can('whatsapp.access');
    Route::get('/integrations/whatsapp/instances', [IntegrationController::class, 'whatsappInstances'])->name('integrations.whatsapp.instances')->can('whatsapp.access');
    Route::get('/integrations/whatsapp/status', [IntegrationController::class, 'whatsappStatus'])->name('integrations.whatsapp.status')->can('whatsapp.access');
    Route::get('/integrations/whatsapp/queue-stats', [IntegrationController::class, 'whatsappQueueStats'])->name('integrations.whatsapp.queue-stats')->can('whatsapp.access');
    Route::put('/integrations/whatsapp/update', [IntegrationController::class, 'whatsappUpdate'])->name('integrations.whatsapp.update')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/toggle-active', [IntegrationController::class, 'whatsappToggleActive'])->name('integrations.whatsapp.toggle-active')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/antiban', [IntegrationController::class, 'whatsappUpdateAntiBan'])->name('integrations.whatsapp.antiban')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/queue/toggle', [IntegrationController::class, 'whatsappToggleQueuePause'])->name('integrations.whatsapp.queue.toggle')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/queue/clear', [IntegrationController::class, 'whatsappClearQueue'])->name('integrations.whatsapp.queue.clear')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/generate-token', [IntegrationController::class, 'whatsappGenerateToken'])->name('integrations.whatsapp.generate-token')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/sync', [IntegrationController::class, 'whatsappSync'])->name('integrations.whatsapp.sync')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/connect', [IntegrationController::class, 'whatsappConnect'])->name('integrations.whatsapp.connect')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/pair', [IntegrationController::class, 'whatsappPairPhone'])->name('integrations.whatsapp.pair')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/disconnect', [IntegrationController::class, 'whatsappDisconnect'])->name('integrations.whatsapp.disconnect')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/reconnect', [IntegrationController::class, 'whatsappReconnect'])->name('integrations.whatsapp.reconnect')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/send-message', [IntegrationController::class, 'whatsappSendMessage'])->name('integrations.whatsapp.send-message')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/check-number', [IntegrationController::class, 'whatsappCheckNumber'])->name('integrations.whatsapp.check-number')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/preview-spintax', [IntegrationController::class, 'whatsappPreviewSpintax'])->name('integrations.whatsapp.preview-spintax')->can('whatsapp.operate');
    Route::post('/integrations/whatsapp/blacklist', [IntegrationController::class, 'whatsappAddToBlacklist'])->name('integrations.whatsapp.blacklist.add')->can('whatsapp.operate');
    Route::delete('/integrations/whatsapp/blacklist/{phone}', [IntegrationController::class, 'whatsappRemoveFromBlacklist'])->name('integrations.whatsapp.blacklist.remove')->can('whatsapp.operate');
    Route::get('/integrations/whatsapp/diagnostic', [IntegrationController::class, 'whatsappDiagnostic'])->name('integrations.whatsapp.diagnostic')->can('whatsapp.access');
    Route::get('/integrations/whatsapp/messages', [IntegrationController::class, 'whatsappMessages'])->name('integrations.whatsapp.messages')->can('whatsapp.access');
    Route::post('/integrations/whatsapp/messages/{id}/retry', [IntegrationController::class, 'whatsappRetryMessage'])->name('integrations.whatsapp.messages.retry')->can('whatsapp.operate');

    // WhatsApp Templates CRUD
    Route::post('/integrations/whatsapp/templates', [IntegrationController::class, 'whatsappTemplatesStore'])->name('integrations.whatsapp.templates.store')->can('whatsapp.operate');
    Route::put('/integrations/whatsapp/templates/{id}', [IntegrationController::class, 'whatsappTemplatesUpdate'])->name('integrations.whatsapp.templates.update')->can('whatsapp.operate');
    Route::delete('/integrations/whatsapp/templates/{id}', [IntegrationController::class, 'whatsappTemplatesDestroy'])->name('integrations.whatsapp.templates.destroy')->can('whatsapp.operate');

    // WhatsApp Broadcasts (Difusión Masiva Segura)
    Route::get('/integrations/whatsapp/broadcast/recipients', [IntegrationController::class, 'whatsappBroadcastRecipients'])->name('integrations.whatsapp.broadcast.recipients')->can('whatsapp.access');
    Route::post('/integrations/whatsapp/broadcast/send', [IntegrationController::class, 'whatsappBroadcastSend'])->name('integrations.whatsapp.broadcast.send')->can('whatsapp.operate');

    // JAAK (Validaciones) Integration Routes
    Route::get('/integrations/validaciones', [IntegrationController::class, 'validacionesIndex'])->name('integrations.validaciones.index')->can('integrations.view');
    Route::put('/integrations/jaak', [IntegrationController::class, 'updateJaak'])->name('integrations.jaak.update')->can('integrations.edit');
    Route::post('/integrations/jaak/test', [IntegrationController::class, 'jaakTest'])->name('integrations.jaak.test')->can('integrations.edit');
});
