<?php

use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\RelojChecadorKioskoController;
use App\Http\Controllers\Admin\VisitaAccesoController;
use App\Http\Controllers\Auth\ForgotPasswordOtpController;
use App\Http\Controllers\SolicitudDemoController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing comercial de Hoshō (clientes, socios, formulario de demo). En la
// instancia de un cliente va apagada (config/modulos.php): la raíz lleva
// directo al login o al dashboard y el formulario de contacto responde 404.


Route::get('/', function () {
    if (! config('modulos.landing')) {
        return redirect()->route(auth()->check() ? 'dashboard' : 'login');
    }

    return Inertia::render('Public/Home');
})->name('home');

Route::post('/contacto', [SolicitudDemoController::class, 'store'])
    ->middleware(['modulo:landing', 'throttle:5,1'])
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
        'locale' => 'required|in:en,es,hi',
    ]);

    session(['locale' => $request->locale]);

    return back();
})->name('locale.update');

// Microsoft Entra ID (Azure AD SSO)
Route::middleware(['guest'])->group(function () {
    Route::get('/auth/sso/azure/redirect', [\App\Http\Controllers\Auth\AzureSsoController::class, 'redirect'])->name('auth.azure.redirect');
    Route::get('/auth/sso/azure/callback', [\App\Http\Controllers\Auth\AzureSsoController::class, 'callback'])->name('auth.azure.callback');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/password/expired', [\App\Http\Controllers\Auth\PasswordExpiredController::class, 'show'])->name('password.expired');
    Route::post('/password/expired', [\App\Http\Controllers\Auth\PasswordExpiredController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('password.expired.update');
});

Route::middleware(['auth','verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard')->can('dashboard.view');
    Route::get('/api/dashboard/stats', [DashboardController::class, 'stats'])->name('api.dashboard.stats')->can('dashboard.view');
});

use App\Http\Controllers\ProveedorPreRegistroController;
use App\Http\Controllers\ProductorPreRegistroController;
use App\Http\Controllers\EmpleadoPreRegistroController;
use App\Http\Controllers\VisitaTemporalPreRegistroController;

Route::get('/preregistro/{token}', [ProveedorPreRegistroController::class, 'showWizard'])->name('preregistro.wizard');
Route::post('/preregistro/{token}', [ProveedorPreRegistroController::class, 'submitWizard'])->name('preregistro.submit');

Route::middleware('modulo:productores')->group(function () {
    Route::get('/preregistro-productor/{token}', [ProductorPreRegistroController::class, 'showWizard'])->name('preregistro-productor.wizard');
    Route::post('/preregistro-productor/{token}', [ProductorPreRegistroController::class, 'submitWizard'])->name('preregistro-productor.submit');
});

Route::get('/preregistro-empleado/{token}', [EmpleadoPreRegistroController::class, 'showWizard'])->name('preregistro-empleado.wizard');
Route::post('/preregistro-empleado/{token}', [EmpleadoPreRegistroController::class, 'submitWizard'])->name('preregistro-empleado.submit');

// Enrolamiento biométrico público de colaboradores vía token
Route::get('/enrolamiento/{token}', [\App\Http\Controllers\Admin\EmpleadoEnrolamientoController::class, 'showPublic'])
    ->middleware('throttle:60,1')
    ->name('enrolamiento.publico.show');
Route::post('/enrolamiento/{token}', [\App\Http\Controllers\Admin\EmpleadoEnrolamientoController::class, 'storePublic'])
    ->middleware('throttle:60,1')
    ->name('enrolamiento.publico.store');

Route::get('/preregistro-visita/{token}', [VisitaTemporalPreRegistroController::class, 'showWizard'])->name('preregistro-visita.wizard');
Route::post('/preregistro-visita/{token}', [VisitaTemporalPreRegistroController::class, 'submitWizard'])->name('preregistro-visita.submit');
Route::post('/preregistro-visita/{token}/tipo-servicio', [VisitaTemporalPreRegistroController::class, 'storeTipoServicio'])->name('preregistro-visita.tipo-servicio.store');

use App\Http\Controllers\VisitaAccesoAutorizacionController;
Route::get('/autorizar-acceso/{token}', [VisitaAccesoAutorizacionController::class, 'show'])->name('autorizar-acceso.show');
Route::post('/autorizar-acceso/{token}', [VisitaAccesoAutorizacionController::class, 'autorizar'])->name('autorizar-acceso.post');
Route::get('/api/autorizar-acceso/{token}/check', [VisitaAccesoAutorizacionController::class, 'checkStatus'])->middleware('throttle:120,1')->name('autorizar-acceso.check');
Route::get('/pase-digital/{uuid}', [VisitaAccesoController::class, 'pasePublico'])->name('pase-digital-visita.show');
Route::post('/pase-digital/{uuid}/datos-acceso', [VisitaAccesoController::class, 'actualizarDatosAcceso'])->name('pase-digital-visita.datos-acceso');
// Los carnets públicos exigen URL firmada: los ids son secuenciales y sin firma cualquiera podía recorrerlos.
Route::get('/carnet-empleado/{empleado}', [\App\Http\Controllers\Admin\EmpleadoController::class, 'carnetPublico'])->middleware(['signed', 'throttle:60,1'])->name('empleados.carnet.publico');
Route::get('/carnet-proveedor/{proveedor}', [\App\Http\Controllers\Admin\ProveedorController::class, 'carnetPublico'])->middleware(['signed', 'throttle:60,1'])->name('proveedores.carnet.publico');
Route::get('/admin/proveedores/{proveedor}/carnet', [\App\Http\Controllers\Admin\ProveedorController::class, 'carnet'])->middleware('auth')->name('proveedores.carnet');
Route::post('/admin/proveedores/{proveedor}/send-carnet-whatsapp', [\App\Http\Controllers\Admin\ProveedorController::class, 'sendCarnetWhatsApp'])->name('proveedores.send-carnet-whatsapp')->middleware(['auth','verified'])->can('proveedores.send-carnet-whatsapp');

Route::middleware('modulo:productores')->group(function () {
    Route::get('/carnet-productor/{productor}', [\App\Http\Controllers\Admin\ProductorController::class, 'carnetPublico'])->middleware(['signed', 'throttle:60,1'])->name('productores.carnet.publico');
    Route::get('/admin/productores/{productor}/carnet', [\App\Http\Controllers\Admin\ProductorController::class, 'carnet'])->middleware('auth')->name('productores.carnet');
    Route::post('/admin/productores/{productor}/send-carnet-whatsapp', [\App\Http\Controllers\Admin\ProductorController::class, 'sendCarnetWhatsApp'])->name('productores.send-carnet-whatsapp')->middleware(['auth','verified'])->can('productores.send-carnet-whatsapp');
});


// Kiosko Reloj Checador (pantalla táctil pública de planta y sus endpoints)
Route::get('admin/reloj-checador/kiosko', [RelojChecadorKioskoController::class, 'kioskoView'])
    ->name('reloj-checador.kiosko');

Route::post('admin/api/reloj-checador/buscar', [RelojChecadorKioskoController::class, 'buscarEmpleado'])
    ->middleware('throttle:120,1')
    ->name('api.reloj-checador.buscar');

Route::post('admin/api/reloj-checador/registrar', [RelojChecadorKioskoController::class, 'registrarMarcaje'])
    ->middleware('throttle:120,1')
    ->name('api.reloj-checador.registrar');

Route::post('admin/api/reloj-checador/enrolar', [RelojChecadorKioskoController::class, 'enrolarEmpleado'])
    ->middleware('throttle:60,1')
    ->name('api.reloj-checador.enrolar');

if (file_exists(__DIR__.'/notifications.php')) {
    require __DIR__.'/notifications.php';
}

if (file_exists(__DIR__.'/larareact-settings.php')) {
    require __DIR__.'/larareact-settings.php';
}
