<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Roles que dan acceso al panel administrativo. Quedan fuera del login por
     * número de empleado. Espeja User::adminRoles de la app móvil.
     */
    private const ROLES_ADMIN = ['super-admin', 'admin', 'operador', 'encargado'];

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
            'message' => 'Credenciales incorrectas',
        ], 401);
    }

    /**
     * Iniciar sesión desde la app móvil usando únicamente el número de empleado.
     *
     * ADVERTENCIA DE SEGURIDAD: este acceso no exige ningún secreto. Quien
     * conozca el número de un compañero (va impreso en el gafete) puede entrar
     * como él y marcarle asistencia. Se habilitó a petición del negocio para
     * facilitar el uso en piso. Como contención mínima, sólo se emite token
     * para cuentas SIN rol administrativo: un admin/operador debe seguir
     * entrando por /api/login con correo y contraseña, para que filtrar un
     * número de empleado nunca entregue el panel completo.
     *
     * La ruta es pública, así que el scope de multitenancy no aplica; esto es
     * correcto porque empleados.codigo_acceso es único a nivel global.
     */
    public function loginEmpleado(Request $request)
    {
        $request->validate([
            'codigo_acceso' => 'required|string|max:20',
        ]);

        $empleado = $this->buscarEmpleadoPorNumero($request->input('codigo_acceso'));

        if (! $empleado) {
            return response()->json([
                'success' => false,
                'message' => 'Número de empleado no válido.',
            ], 401);
        }

        $user = $empleado->user;

        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Tu número no está vinculado a una cuenta de acceso. Contacta a Recursos Humanos.',
            ], 403);
        }

        if ($user->hasAnyRole(self::ROLES_ADMIN)) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta es administrativa: ingresa con correo y contraseña.',
            ], 403);
        }

        // users.status es nullable con default 'activo': sólo bloquea cuando
        // trae un valor distinto.
        if ($user->status && $user->status !== 'activo') {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está inactiva. Contacta a Recursos Humanos.',
            ], 403);
        }

        // Una sola sesión móvil por usuario, igual que en login().
        $user->tokens()->where('name', 'movil_app')->delete();

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

    /**
     * Resolver un empleado activo a partir de lo tecleado en el numpad.
     *
     * Acepta las mismas variantes que el kiosko (KioskoApiController::buscar):
     * con separadores, con ceros a la izquierda o sin ellos, para que un número
     * que funciona en el kiosko funcione también al iniciar sesión.
     */
    private function buscarEmpleadoPorNumero(string $entrada): ?Empleado
    {
        $query = trim($entrada);
        $cleanQuery = preg_replace('/[^a-zA-Z0-9]/', '', $query);
        $isNumeric = ctype_digit($cleanQuery);
        $intVal = $isNumeric ? (int) $cleanQuery : null;

        return Empleado::with('user')
            ->where('status', true)
            ->where(function ($q) use ($query, $cleanQuery, $isNumeric, $intVal) {
                $q->where('codigo_acceso', $query)
                    ->orWhere('codigo_acceso', $cleanQuery)
                    ->orWhere('documento_identidad', $query)
                    ->orWhere('documento_identidad', $cleanQuery);

                if ($isNumeric && $intVal > 0) {
                    $q->orWhere('codigo_acceso', sprintf('%08d', $intVal))
                        ->orWhere('documento_identidad', sprintf('%06d', $intVal))
                        ->orWhere('codigo_acceso', (string) $intVal)
                        ->orWhere('documento_identidad', (string) $intVal);
                }
            })
            ->first();
    }

    /**
     * Cerrar sesión en la app móvil (destruye el token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente',
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
