<?php

use App\Http\Controllers\Admin\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Vista de expiración / bloqueo
    Route::get('/subscription/expired', [SubscriptionController::class, 'expired'])->name('subscription.expired');

    // Panel de suscripción de la empresa
    Route::get('/monitoring/subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::post('/monitoring/subscription/renew', [SubscriptionController::class, 'renew'])->name('subscription.renew');

    // Gestión global de suscripciones para Empresa ID 1 / Super Admin
    Route::get('/monitoring/subscription/manage', [SubscriptionController::class, 'manage'])->name('subscription.manage');
    Route::post('/monitoring/subscription/approve/{payment}', [SubscriptionController::class, 'approvePayment'])->name('subscription.approve');
    Route::post('/monitoring/subscription/reject/{payment}', [SubscriptionController::class, 'rejectPayment'])->name('subscription.reject');
    Route::post('/monitoring/subscription/update-empresa/{empresa}', [SubscriptionController::class, 'updateEmpresaSubscription'])->name('subscription.update-empresa');
});
