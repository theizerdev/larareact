<?php

use App\Http\Controllers\Admin\IntegrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index')->can('integrations.view');
    Route::get('/integrations/map', [IntegrationController::class, 'mapboxMap'])->name('integrations.mapbox.map')->can('integrations.view');
    Route::get('/integrations/map/navigation', [IntegrationController::class, 'mapboxNavigation'])->name('integrations.mapbox.navigation')->can('integrations.view');
    Route::put('/integrations/mapbox', [IntegrationController::class, 'updateMapbox'])->name('integrations.mapbox.update')->can('integrations.edit');
    Route::put('/integrations/google-maps', [IntegrationController::class, 'updateGoogleMaps'])->name('integrations.google-maps.update')->can('integrations.edit');

    // WhatsApp Integration Routes
    Route::get('/integrations/whatsapp', [IntegrationController::class, 'whatsappIndex'])->name('integrations.whatsapp.index')->can('integrations.view');
    Route::get('/integrations/whatsapp/status', [IntegrationController::class, 'whatsappStatus'])->name('integrations.whatsapp.status')->can('integrations.view');
    Route::put('/integrations/whatsapp/update', [IntegrationController::class, 'whatsappUpdate'])->name('integrations.whatsapp.update')->can('integrations.edit');
    Route::post('/integrations/whatsapp/generate-token', [IntegrationController::class, 'whatsappGenerateToken'])->name('integrations.whatsapp.generate-token')->can('integrations.edit');
    Route::post('/integrations/whatsapp/sync', [IntegrationController::class, 'whatsappSync'])->name('integrations.whatsapp.sync')->can('integrations.edit');
    Route::post('/integrations/whatsapp/connect', [IntegrationController::class, 'whatsappConnect'])->name('integrations.whatsapp.connect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/disconnect', [IntegrationController::class, 'whatsappDisconnect'])->name('integrations.whatsapp.disconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/reconnect', [IntegrationController::class, 'whatsappReconnect'])->name('integrations.whatsapp.reconnect')->can('integrations.edit');
    Route::post('/integrations/whatsapp/send-message', [IntegrationController::class, 'whatsappSendMessage'])->name('integrations.whatsapp.send-message')->can('integrations.edit');
});