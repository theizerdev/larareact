<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

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

    /**
     * Actualizar datos básicos del perfil.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'telefono' => 'sometimes|nullable|string|max:30',
            'email' => 'sometimes|email|unique:users,email,'.$user->id,
        ]);

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado.',
            'user' => array_merge($user->fresh()->toArray(), [
                'roles' => $user->getRoleNames()->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ]),
        ]);
    }

    /**
     * Cambiar la contraseña (requiere la contraseña actual).
     */
    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta.',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->new_password)]);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }
}
