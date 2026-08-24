<?php

use App\Http\Controllers\Admin\SubscriptionController;
use App\Http\Controllers\Admin\SubscriptionPlanController;
use Illuminate\Support\Facades\Route;

Route::middleware(['verified'])->group(function () {
    // Vista de expiración / bloqueo
    Route::get('/subscription/expired', [SubscriptionController::class, 'expired'])->name('subscription.expired');

    // Rutas específicas de PayPal
    Route::post('/monitoring/subscription/paypal/create-order', [SubscriptionController::class, 'createPaypalOrder'])->name('subscription.paypal.create-order');
    Route::post('/monitoring/subscription/paypal/capture-order/{orderId}', [SubscriptionController::class, 'capturePaypalOrder'])->name('subscription.paypal.capture-order');

    // Panel de suscripción de la empresa
    Route::get('/monitoring/subscription', [SubscriptionController::class, 'index'])->name('subscription.index');
    Route::post('/monitoring/subscription/renew', [SubscriptionController::class, 'renew'])->name('subscription.renew');

    // Gestión global de suscripciones para Empresa ID 1 / Super Admin
    Route::get('/monitoring/subscription/manage', [SubscriptionController::class, 'manage'])->name('subscription.manage');
    Route::post('/monitoring/subscription/approve/{payment}', [SubscriptionController::class, 'approvePayment'])->name('subscription.approve');
    Route::post('/monitoring/subscription/reject/{payment}', [SubscriptionController::class, 'rejectPayment'])->name('subscription.reject');
    Route::post('/monitoring/subscription/update-empresa/{empresa}', [SubscriptionController::class, 'updateEmpresaSubscription'])->name('subscription.update-empresa');

    // Módulo Administrativo de Gestión de Planes (Super Admin)
    Route::get('/planes', [SubscriptionPlanController::class, 'index'])->name('planes.index');
    Route::post('/planes', [SubscriptionPlanController::class, 'store'])->name('planes.store');
    Route::put('/planes/{plane}', [SubscriptionPlanController::class, 'update'])->name('planes.update');
    Route::delete('/planes/{plane}', [SubscriptionPlanController::class, 'destroy'])->name('planes.destroy');
    Route::patch('/planes/{plane}/toggle-promo', [SubscriptionPlanController::class, 'togglePromo'])->name('planes.toggle-promo');
    Route::patch('/planes/{plane}/toggle-status', [SubscriptionPlanController::class, 'toggleStatus'])->name('planes.toggle-status');
    Route::patch('/planes/{plane}/toggle-destacado', [SubscriptionPlanController::class, 'toggleDestacado'])->name('planes.toggle-destacado');
});

