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
    Route::post('/forgot-password/send-otp', [ForgotPasswordOtpController::class, 'sendOtp'])->name('password.send-otp');
    Route::post('/forgot-password/verify-otp', [ForgotPasswordOtpController::class, 'verifyOtp'])->name('password.verify-otp');
    Route::post('/forgot-password/reset', [ForgotPasswordOtpController::class, 'resetPassword'])->name('password.otp-reset');
});

// Ruta Pública de Cuestionario Pre-Consulta (para el paciente en sala de espera)
Route::get('/preconsulta/{token}', [\App\Http\Controllers\Publico\PreconsultaPublicController::class, 'show'])->name('preconsulta.show');
Route::post('/preconsulta/{token}', [\App\Http\Controllers\Publico\PreconsultaPublicController::class, 'store'])->name('preconsulta.store');



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


if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
