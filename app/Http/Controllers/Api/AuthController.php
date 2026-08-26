<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Iniciar sesión desde la app móvil.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($request->only('email', 'password'))) {
            $user = Auth::user();
            
            // Revocar tokens anteriores si deseas una sola sesión móvil
            $user->tokens()->where('name', 'movil_app')->delete();

            // Crear nuevo token
            $token = $user->createToken('movil_app')->plainTextToken;

            return response()->json([
                'success' => true,
                'token' => $token,
                'user' => array_merge($user->toArray(), [
                    'roles' => $user->getRoleNames()->values(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ]),
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Credenciales incorrectas'
        ], 401);
    }

    /**
     * Cerrar sesión en la app móvil (destruye el token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }
}
