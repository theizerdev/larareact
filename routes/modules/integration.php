<?php

use App\Http\Controllers\Admin\IntegrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/integrations', [IntegrationController::class, 'index'])->name('integrations.index')->can('integrations.view');
    Route::put('/integrations/mapbox', [IntegrationController::class, 'updateMapbox'])->name('integrations.mapbox.update')->can('integrations.edit');
});
