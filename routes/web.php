<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\VisitaAccesoController;
use App\Http\Controllers\Auth\ForgotPasswordOtpController;
use App\Http\Controllers\SolicitudDemoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing page pública: siempre visible, con o sin sesión. El propio landing
// decide a dónde llevar al usuario (login o dashboard) según su estado de auth.
Route::get('/', function () {
    return redirect()->route('dashboard');
})->name('home');

Route::middleware(['guest'])->group(function () {
    Route::get('/forgot-password', [ForgotPasswordOtpController::class, 'show'])->name('password.request');
    Route::post('/forgot-password/send-otp', [ForgotPasswordOtpController::class, 'sendOtp'])
        ->middleware('throttle:6,1')
        ->name('password.send-otp');
    Route::post('/forgot-password/verify-otp', [ForgotPasswordOtpController::class, 'verifyOtp'])
        ->middleware('throttle:6,1')
        ->name('password.verify-otp');
    Route::post('/forgot-password/reset', [ForgotPasswordOtpController::class, 'resetPassword'])
        ->middleware('throttle:6,1')
        ->name('password.otp-reset');

    // Microsoft Entra ID (Azure AD SSO)
    Route::get('/auth/sso/azure/redirect', [\App\Http\Controllers\Auth\AzureSsoController::class, 'redirect'])->name('auth.azure.redirect');
    Route::get('/auth/sso/azure/callback', [\App\Http\Controllers\Auth\AzureSsoController::class, 'callback'])->name('auth.azure.callback');
});

Route::post('locale', function (Request $request) {
    $request->validate([
        'locale' => 'required|in:en,es',
    ]);

    session(['locale' => $request->locale]);

    return back();
})->name('locale.update');

Route::middleware(['auth','verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard')->can('dashboard.view');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/password/expired', [\App\Http\Controllers\Auth\PasswordExpiredController::class, 'show'])->name('password.expired');
    Route::post('/password/expired', [\App\Http\Controllers\Auth\PasswordExpiredController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.expired.update');
});


if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
