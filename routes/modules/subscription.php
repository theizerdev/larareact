<?php

use App\Http\Controllers\Admin\SubscriptionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->name('subscription.')->group(function () {
    // Vista de expiración / bloqueo
    Route::get('/subscription/expired', [SubscriptionController::class, 'expired'])->name('expired');

    // Rutas específicas de PayPal
    Route::post('/monitoring/subscription/paypal/create-order', [SubscriptionController::class, 'createPaypalOrder'])->name('paypal.create-order');
    Route::post('/monitoring/subscription/paypal/capture-order/{orderId}', [SubscriptionController::class, 'capturePaypalOrder'])->name('paypal.capture-order');

    // Panel de suscripción de la empresa
    Route::get('/monitoring/subscription', [SubscriptionController::class, 'index'])->name('index');
    Route::post('/monitoring/subscription/renew', [SubscriptionController::class, 'renew'])->name('renew');

    // Gestión global de suscripciones para Empresa ID 1 / Super Admin
    Route::get('/monitoring/subscription/manage', [SubscriptionController::class, 'manage'])->name('manage');
    Route::post('/monitoring/subscription/approve/{payment}', [SubscriptionController::class, 'approvePayment'])->name('approve');
    Route::post('/monitoring/subscription/reject/{payment}', [SubscriptionController::class, 'rejectPayment'])->name('reject');
    Route::post('/monitoring/subscription/update-empresa/{empresa}', [SubscriptionController::class, 'updateEmpresaSubscription'])->name('update-empresa');
});

