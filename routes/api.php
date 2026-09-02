<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KioskoApiController;
use App\Http\Controllers\Api\MovilDataController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Rutas públicas de API
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas por Sanctum
Route::middleware('auth:sanctum')->group(function () {
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

    // Kiosko Checador (API para la app móvil)
    Route::prefix('reloj-checador')->group(function () {
        Route::get('/configuracion', [KioskoApiController::class, 'configuracion']);
        Route::get('/mi-empleado', [KioskoApiController::class, 'miEmpleado']);
        Route::get('/mi-historial', [KioskoApiController::class, 'miHistorial']);
        Route::post('/buscar', [KioskoApiController::class, 'buscar']);
        Route::post('/registrar', [KioskoApiController::class, 'registrar']);
    });

    // Datos para las pantallas de la app móvil (Dashboard, Empleados, Bitácora).
    // Nota: /api/dashboard/stats ya existe en routes/web.php (auth de sesión),
    // por eso el resumen del móvil usa una ruta distinta para evitar colisión.
    Route::get('/dashboard/resumen', [MovilDataController::class, 'dashboardStats']);
    Route::get('/empleados', [MovilDataController::class, 'empleados']);
    Route::get('/empleados/{id}', [MovilDataController::class, 'empleadoDetalle'])->whereNumber('id');
    Route::get('/empleados/{id}/marcajes', [MovilDataController::class, 'empleadoMarcajes'])->whereNumber('id');
    Route::get('/asistencia/bitacora', [MovilDataController::class, 'bitacora']);
    Route::get('/asistencia/nomina', [MovilDataController::class, 'nomina']);
    Route::get('/accesos', [MovilDataController::class, 'accesos']);

    // Notificaciones
    Route::get('/notifications', [MovilDataController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [MovilDataController::class, 'markNotificationRead']);
    Route::post('/notifications/read-all', [MovilDataController::class, 'markAllNotificationsRead']);
});
