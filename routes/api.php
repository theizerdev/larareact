<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KioskoApiController;

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
    
    // Kiosko Checador (API para la app móvil)
    Route::prefix('reloj-checador')->group(function () {
        Route::get('/configuracion', [KioskoApiController::class, 'configuracion']);
        Route::post('/buscar', [KioskoApiController::class, 'buscar']);
        Route::post('/registrar', [KioskoApiController::class, 'registrar']);
    });
});
