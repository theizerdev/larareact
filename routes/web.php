<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\ForgotPasswordOtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['guest'])->group(function () {
    Route::get('/forgot-password', [ForgotPasswordOtpController::class, 'show'])->name('password.request');
    Route::post('/forgot-password/send-otp', [ForgotPasswordOtpController::class, 'sendOtp'])->name('password.send-otp');
    Route::post('/forgot-password/verify-otp', [ForgotPasswordOtpController::class, 'verifyOtp'])->name('password.verify-otp');
    Route::post('/forgot-password/reset', [ForgotPasswordOtpController::class, 'resetPassword'])->name('password.otp-reset');
});

Route::post('locale', function (Request $request) {
    $request->validate([
        'locale' => 'required|in:en,es',
    ]);

    session(['locale' => $request->locale]);

    return back();
})->name('locale.update');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    });
});

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
