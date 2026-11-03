<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KioskoApiController;
use App\Http\Controllers\Api\MovilDataController;
use App\Http\Middleware\EnsureUserActive;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas públicas de API
// Mismo limitador que el login web de Fortify (5 por minuto por correo + IP):
// sin él la app permitía adivinar contraseñas a ritmo libre.
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// Acceso de trabajadores con sólo el número de empleado (sin contraseña).
// El throttle es la única barrera contra enumerar números ajenos, porque el
// endpoint no pide ningún secreto: 10 intentos por minuto y por IP.
Route::post('/login-empleado', [AuthController::class, 'loginEmpleado'])
    ->middleware('throttle:10,1');

// Microsoft Entra ID: canje del código que devuelve /auth/sso/azure/movil.
Route::post('/login-microsoft', [AuthController::class, 'loginMicrosoft'])
    ->middleware('throttle:10,1');

// Enrolamiento con el enlace (o su QR) que RH manda: el token es el secreto,
// igual que en la página pública /enrolamiento/{token} del web.
Route::prefix('enrolamiento/{token}')->middleware('throttle:20,1')->group(function () {
    Route::get('/', [KioskoApiController::class, 'enlaceEnrolamiento']);
    Route::post('/', [KioskoApiController::class, 'enrolarConEnlace']);
});

// Rutas protegidas por Sanctum. EnsureUserActive: una cuenta desactivada
// pierde el acceso aunque conserve su token.
Route::middleware(['auth:sanctum', EnsureUserActive::class])->group(function () {
    // Usuario autenticado (incluye roles y permisos para que la app móvil
    // pueda decidir si es un "trabajador" en modo restringido)
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        return array_merge($user->toArray(), [
            'roles' => $user->getRoleNames()->values(),
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ]);
    });

    // Cerrar sesión
    Route::post('/logout', [AuthController::class, 'logout']);

    // Perfil / cuenta
    Route::put('/user', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::put('/user/layout', [AuthController::class, 'updateLayout']);

    // Kiosko Checador (API para la app móvil)
    Route::prefix('reloj-checador')->group(function () {
        Route::get('/configuracion', [KioskoApiController::class, 'configuracion']);
        Route::get('/mi-empleado', [KioskoApiController::class, 'miEmpleado']);
        Route::get('/mi-historial', [KioskoApiController::class, 'miHistorial']);
        // Buscar a cualquier empleado es función del kiosko (mismo permiso que
        // en el web). Registrar valida dentro: el propio empleado o el permiso.
        Route::post('/buscar', [KioskoApiController::class, 'buscar'])
            ->middleware('permission:asistencia.kiosko|asistencia.view');
        Route::post('/registrar', [KioskoApiController::class, 'registrar']);
        // Igual: el propio empleado, o enrolar a otros con permiso del kiosko.
        Route::post('/enrolar', [KioskoApiController::class, 'enrolar']);
        // Enlace/QR de enrolamiento para que el empleado se enrole desde su
        // teléfono; mismo permiso que "Enviar enlace" en Colaboradores.
        Route::post('/enlace-enrolamiento', [KioskoApiController::class, 'generarEnlaceEnrolamiento'])
            ->middleware('permission:empleados.edit');
        // Alta del empleado que aún no está en el sistema, para enrolarlo.
        Route::middleware('permission:empleados.create')->group(function () {
            Route::get('/departamentos', [KioskoApiController::class, 'departamentos']);
            Route::post('/empleados', [KioskoApiController::class, 'altaEmpleado']);
        });
    });

    // Datos para las pantallas de la app móvil (Dashboard, Empleados, Bitácora).
    // Nota: /api/dashboard/stats ya existe en routes/web.php (auth de sesión),
    // por eso el resumen del móvil usa una ruta distinta para evitar colisión.
    // Cada pantalla exige el mismo permiso que su equivalente web: antes solo
    // pedían token, y el que se obtiene con el número de empleado (sin
    // contraseña) leía CURP, teléfono y salario de toda la plantilla.
    Route::get('/dashboard/resumen', [MovilDataController::class, 'dashboardStats'])
        ->middleware('permission:dashboard.view');
    Route::middleware('permission:empleados.view')->group(function () {
        Route::get('/empleados', [MovilDataController::class, 'empleados']);
        Route::get('/empleados/{id}', [MovilDataController::class, 'empleadoDetalle'])->whereNumber('id');
        Route::get('/empleados/{id}/marcajes', [MovilDataController::class, 'empleadoMarcajes'])->whereNumber('id');
    });
    Route::get('/asistencia/bitacora', [MovilDataController::class, 'bitacora'])
        ->middleware('permission:asistencia.bitacora|asistencia.view');
    Route::get('/asistencia/nomina', [MovilDataController::class, 'nomina'])
        ->middleware('permission:asistencia.nomina|asistencia.view');
    Route::get('/accesos', [MovilDataController::class, 'accesos'])
        ->middleware('permission:visitas_temporales.view');

    // Notificaciones
    Route::get('/notifications', [MovilDataController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [MovilDataController::class, 'markNotificationRead']);
    Route::post('/notifications/read-all', [MovilDataController::class, 'markAllNotificationsRead']);
});
