<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Auth\ForgotPasswordOtpController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ContactController;
use App\Http\Controllers\Admin\TestimonioController;
use App\Http\Controllers\Admin\ReparacionController;
use App\Models\SubscriptionPlan;
use App\Models\Testimonio;
use Inertia\Inertia;


Route::get('/', function () {
    SubscriptionPlan::ensureDefaultPlansExist();

    $testimonios = Testimonio::where('activo', true)
        ->orderBy('destacado', 'desc')
        ->orderBy('orden', 'asc')
        ->get();

    $planes = SubscriptionPlan::where('activo', true)
        ->orderBy('id', 'asc')
        ->get();

    return Inertia::render('welcome', [
        'testimonios' => $testimonios,
        'planes' => $planes,
    ]);
})->name('home');

Route::post('/contact-request', [ContactController::class, 'send'])->name('contact.send');

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

use App\Http\Controllers\Admin\SuperAdminDashboardController;
use App\Http\Controllers\Auth\WhatsAppVerificationController;
use App\Http\Middleware\EnsureWhatsAppIsVerified;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/verify-whatsapp', [WhatsAppVerificationController::class, 'show'])->name('verify-whatsapp.index');
    Route::post('/verify-whatsapp/verify', [WhatsAppVerificationController::class, 'verify'])->name('verify-whatsapp.verify');
    Route::post('/verify-whatsapp/resend', [WhatsAppVerificationController::class, 'resend'])->name('verify-whatsapp.resend');

    Route::middleware([EnsureWhatsAppIsVerified::class])->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('superadministrador/dashboard0', [SuperAdminDashboardController::class, 'index'])->name('superadmin.dashboard');

        Route::prefix('admin')->name('admin.')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
            Route::resource('testimonios', TestimonioController::class)->except(['create', 'edit', 'show']);
            Route::patch('testimonios/{testimonio}/toggle-status', [TestimonioController::class, 'toggleStatus'])->name('testimonios.toggle-status');
            Route::patch('testimonios/{testimonio}/toggle-featured', [TestimonioController::class, 'toggleFeatured'])->name('testimonios.toggle-featured');
        });
    });
});

  Route::get('admin/reparaciones/{reparacion}/reporte-pdf', [ReparacionController::class, 'reportePdf'])
        ->name('reparaciones.reporte-pdf');

// Portal público de consulta y tracking de reparaciones por empresa
use App\Http\Controllers\PublicReparacionTrackingController;

// Rutas asociadas a la empresa específica
Route::get('/reparacion/{empresa}/consultar/{numero_orden?}', [PublicReparacionTrackingController::class, 'show'])
    ->name('reparacion.empresa.consultar');
Route::get('/reparaciones/{empresa}/consultar/{numero_orden?}', [PublicReparacionTrackingController::class, 'show'])
    ->name('reparaciones.empresa.consultar');
Route::post('/reparacion/{empresa}/consultar/{numero_orden}/presupuesto', [PublicReparacionTrackingController::class, 'responderPresupuesto'])
    ->name('reparacion.empresa.consultar.presupuesto');

// Rutas de fallback generales (compatibilidad con tickets anteriores)
Route::get('/reparacion/consultar/{numero_orden?}', [PublicReparacionTrackingController::class, 'showFallback'])
    ->name('reparacion.consultar');
Route::get('/reparaciones/consultar/{numero_orden?}', [PublicReparacionTrackingController::class, 'showFallback'])
    ->name('reparaciones.consultar');
Route::post('/reparacion/consultar/{numero_orden}/presupuesto', [PublicReparacionTrackingController::class, 'responderPresupuestoFallback'])
    ->name('reparacion.consultar.presupuesto');

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
