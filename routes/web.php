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
    return Inertia::render('Public/Home');
})->name('home');

Route::post('/contacto', [SolicitudDemoController::class, 'store'])
    ->middleware('throttle:5,1')
    ->name('contacto.store');

// Módulo de Control de Garita (Lector QR)
// These had no auth middleware at all - garita() runs an open search across
// Empleados/Proveedores/Productores with zero tenant scoping, since the
// Multitenantable scope only activates when auth()->check() is true. An
// anonymous request returned full PII (CURP, phone, access card numbers,
// vehicle plates) for any company in the system. Confirmed in QA testing
// (2026-08-21). Requiring auth here restores the existing tenant scope
// automatically - no controller changes needed for that part.
Route::middleware('auth')->group(function () {
    Route::get('/garita', [VisitaAccesoController::class, 'garita'])->name('garita.show');
    Route::get('/admin/garita', [VisitaAccesoController::class, 'garita'])->name('admin.garita.show');
    Route::get('/admin/visitas-accesos/garita', [VisitaAccesoController::class, 'garita'])->name('admin.visitas-accesos.garita.show');
});

Route::middleware(['guest'])->group(function () {
    Route::get('/forgot-password', [ForgotPasswordOtpController::class, 'show'])->name('password.request');
    Route::post('/forgot-password/send-otp', [ForgotPasswordOtpController::class, 'sendOtp'])
        ->middleware('throttle:6,1')
        ->name('password.send-otp');
    // verify-otp had NO throttling at all - a 6-digit OTP is only 1M
    // possibilities, and confirmed in QA testing (2026-08-21): 15 rapid
    // wrong guesses all went through with zero pushback. throttle:6,1
    // limits brute force to 60 guesses over the OTP's 10-minute validity
    // window per IP, matching the throttle:6,1 already used on
    // settings/password elsewhere in this app.
    Route::post('/forgot-password/verify-otp', [ForgotPasswordOtpController::class, 'verifyOtp'])
        ->middleware('throttle:6,1')
        ->name('password.verify-otp');
    Route::post('/forgot-password/reset', [ForgotPasswordOtpController::class, 'resetPassword'])
        ->middleware('throttle:6,1')
        ->name('password.otp-reset');
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
    Route::get('/api/dashboard/stats', [DashboardController::class, 'stats'])->name('api.dashboard.stats');
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
Route::get('/pase-digital/{uuid}', [VisitaAccesoController::class, 'pasePublico'])->name('pase-digital-visita.show');
Route::post('/pase-digital/{uuid}/datos-acceso', [VisitaAccesoController::class, 'actualizarDatosAcceso'])->name('pase-digital-visita.datos-acceso');
Route::get('/carnet-empleado/{empleado}', [\App\Http\Controllers\Admin\EmpleadoController::class, 'carnetPublico'])->name('empleados.carnet.publico');
Route::get('/carnet-proveedor/{proveedor}', [\App\Http\Controllers\Admin\ProveedorController::class, 'carnetPublico'])->name('proveedores.carnet.publico');
Route::get('/admin/proveedores/{proveedor}/carnet', [\App\Http\Controllers\Admin\ProveedorController::class, 'carnet'])->name('proveedores.carnet');
Route::post('/admin/proveedores/{proveedor}/send-carnet-whatsapp', [\App\Http\Controllers\Admin\ProveedorController::class, 'sendCarnetWhatsApp'])->name('proveedores.send-carnet-whatsapp')->middleware(['auth','verified'])->can('proveedores.send-carnet-whatsapp');

Route::get('/carnet-productor/{productor}', [\App\Http\Controllers\Admin\ProductorController::class, 'carnetPublico'])->name('productores.carnet.publico');
Route::get('/admin/productores/{productor}/carnet', [\App\Http\Controllers\Admin\ProductorController::class, 'carnet'])->name('productores.carnet');
Route::post('/admin/productores/{productor}/send-carnet-whatsapp', [\App\Http\Controllers\Admin\ProductorController::class, 'sendCarnetWhatsApp'])->name('productores.send-carnet-whatsapp')->middleware(['auth','verified'])->can('productores.send-carnet-whatsapp');


use App\Http\Controllers\Admin\RelojChecadorKioskoController;

// SAFE STOPGAP, not necessarily the final design - see QA notes
// (2026-08-21). These had no auth middleware at all. buscarEmpleado()
// does `->when($empresaId, fn ($q) => $q->where('empresa_id', $empresaId))`
// - when unauthenticated $empresaId is null, so the when() condition is
// false and the company filter is silently skipped entirely, on top of
// Multitenantable's own scope also being inactive for an anonymous
// request. Confirmed exploitable: an anonymous request found a real
// employee's PII by access code across company boundaries, then
// successfully registered a fake clock-in for them - which triggers real
// LFT payroll recalculation and a real WhatsApp notification to that
// employee. This is worse than the garita leak (read+write, real
// financial/payroll impact), fixed the same way pending confirmation
// this doesn't break how physical time-clock kiosks actually operate.
Route::middleware('auth')->group(function () {
    Route::get('admin/reloj-checador/kiosko', [RelojChecadorKioskoController::class, 'kioskoView'])
        ->name('reloj-checador.kiosko');

    Route::post('admin/api/reloj-checador/buscar', [RelojChecadorKioskoController::class, 'buscarEmpleado'])
        ->name('api.reloj-checador.buscar');

    Route::post('admin/api/reloj-checador/registrar', [RelojChecadorKioskoController::class, 'registrarMarcaje'])
        ->name('api.reloj-checador.registrar');
});




if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
