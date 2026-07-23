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

use App\Http\Controllers\ProveedorPreRegistroController;
use App\Http\Controllers\ProductorPreRegistroController;
use App\Http\Controllers\EmpleadoPreRegistroController;
use App\Http\Controllers\VisitaTemporalPreRegistroController;

Route::get('/preregistro/{token}', [ProveedorPreRegistroController::class, 'showWizard'])->name('preregistro.wizard');
Route::post('/preregistro/{token}', [ProveedorPreRegistroController::class, 'submitWizard'])->name('preregistro.submit');

Route::get('/preregistro-productor/{token}', [ProductorPreRegistroController::class, 'showWizard'])->name('preregistro-productor.wizard');
Route::post('/preregistro-productor/{token}', [ProductorPreRegistroController::class, 'submitWizard'])->name('preregistro-productor.submit');

Route::get('/preregistro-empleado/{token}', [EmpleadoPreRegistroController::class, 'showWizard'])->name('preregistro-empleado.wizard');
Route::post('/preregistro-empleado/{token}', [EmpleadoPreRegistroController::class, 'submitWizard'])->name('preregistro-empleado.submit');

Route::get('/preregistro-visita/{token}', [VisitaTemporalPreRegistroController::class, 'showWizard'])->name('preregistro-visita.wizard');
Route::post('/preregistro-visita/{token}', [VisitaTemporalPreRegistroController::class, 'submitWizard'])->name('preregistro-visita.submit');
Route::post('/preregistro-visita/{token}/tipo-servicio', [VisitaTemporalPreRegistroController::class, 'storeTipoServicio'])->name('preregistro-visita.tipo-servicio.store');

use App\Http\Controllers\VisitaAccesoAutorizacionController;
Route::get('/autorizar-acceso/{token}', [VisitaAccesoAutorizacionController::class, 'show'])->name('autorizar-acceso.show');
Route::post('/autorizar-acceso/{token}', [VisitaAccesoAutorizacionController::class, 'autorizar'])->name('autorizar-acceso.post');
Route::get('/api/autorizar-acceso/{token}/check', [VisitaAccesoAutorizacionController::class, 'checkStatus'])->name('autorizar-acceso.check');

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
