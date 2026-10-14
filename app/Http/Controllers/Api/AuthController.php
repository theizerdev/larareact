<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSox;
use App\Models\Empleado;
use App\Models\User;
use App\Rules\NotInPasswordHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Roles que dan acceso al panel administrativo. Quedan fuera del login por
     * número de empleado. Espeja User::adminRoles de la app móvil.
     */
    private const ROLES_ADMIN = ['super-admin', 'admin', 'operador', 'encargado'];

    /**
     * Iniciar sesión desde la app móvil.
     *
     * Aplica la misma política SOX que el login web (FortifyServiceProvider):
     * cuenta bloqueada, contador de intentos fallidos y bloqueo temporal al
     * llegar al límite. Sin esto la app sería una puerta para adivinar
     * contraseñas sin que el bloqueo se active.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string',
            'password' => 'required',
        ]);

        // Igual que el web: se acepta correo o usuario, y el correo se guarda
        // en minúsculas.
        $login = mb_strtolower(trim($request->input('email')));
        $user = User::where('email', $login)->orWhere('username', $request->input('email'))->first();

        if (! $user) {
            return $this->credencialesIncorrectas();
        }

        $soxConfig = ConfiguracionSox::current($user->empresa_id);

        if ($user->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => "Esta cuenta está temporalmente bloqueada por superar el límite de {$soxConfig->max_failed_attempts} intentos fallidos. Contacte al administrador para solicitar el desbloqueo.",
            ], 423);
        }

        if (! Hash::check($request->input('password'), $user->password)) {
            $attempts = $user->failed_login_attempts + 1;

            if ($attempts >= $soxConfig->max_failed_attempts) {
                $user->update([
                    'failed_login_attempts' => $attempts,
                    'locked_until' => now()->addMinutes($soxConfig->lockout_minutes),
                ]);

                activity('auth')
                    ->causedBy($user)
                    ->performedOn($user)
                    ->withProperties([
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'evento' => 'sox_lockout',
                        'canal' => 'app_movil',
                        'intentos' => $attempts,
                        'minutos_bloqueo' => $soxConfig->lockout_minutes,
                    ])
                    ->event('sox_lockout')
                    ->log("Cuenta de {$user->name} bloqueada por {$soxConfig->lockout_minutes} min tras {$attempts} intentos fallidos (app móvil)");

                return response()->json([
                    'success' => false,
                    'message' => "Ha alcanzado el límite de {$soxConfig->max_failed_attempts} intentos fallidos. Su cuenta ha sido bloqueada por seguridad.",
                ], 423);
            }

            $user->update(['failed_login_attempts' => $attempts]);

            return $this->credencialesIncorrectas();
        }

        if ($user->status && $user->status !== 'activo') {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está inactiva. Contacta al administrador.',
            ], 403);
        }

        $empleadoVinculado = Empleado::where('user_id', $user->id)->first();
        if ($empleadoVinculado && ! $user->hasAnyRole(self::ROLES_ADMIN) && ! $empleadoVinculado->permite_app_movil) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para acceder a la aplicación móvil. Contacta a Recursos Humanos.',
            ], 403);
        }

        $user->update(['failed_login_attempts' => 0, 'locked_until' => null]);

        return $this->emitirToken($user);
    }

    private function credencialesIncorrectas()
    {
        return response()->json([
            'success' => false,
            'message' => 'Credenciales incorrectas',
        ], 401);
    }

    /**
     * Emite el token de la app (una sola sesión móvil por usuario).
     */
    private function emitirToken(User $user)
    {
        $user->tokens()->where('name', 'movil_app')->delete();

        $token = $user->createToken('movil_app')->plainTextToken;
        $empleado = Empleado::where('user_id', $user->id)->first();

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => array_merge($user->toArray(), [
                'roles' => $user->getRoleNames()->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ]),
            'empleado' => $empleado ? [
                'id' => $empleado->id,
                'nombre_completo' => $empleado->nombre_completo,
                'permite_app_movil' => (bool) $empleado->permite_app_movil,
                'intervalo_geolocalizacion_minutos' => $empleado->intervalo_geolocalizacion_minutos ?? 15,
            ] : null,
            'intervalo_geolocalizacion_minutos' => $empleado?->intervalo_geolocalizacion_minutos ?? 15,
        ]);
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

        if (! $empleado->permite_app_movil) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para acceder a la aplicación móvil. Contacta a Recursos Humanos.',
            ], 403);
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

        // Un bloqueo SOX (por intentos fallidos o puesto por un admin) también
        // cierra este acceso, aunque aquí no se pida contraseña.
        if ($user->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está bloqueada temporalmente. Contacta a Recursos Humanos.',
            ], 423);
        }

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
        $user = $request->user();

        // Mismas reglas que Ajustes > Seguridad en el web: complejidad por
        // defecto y sin repetir contraseñas del historial SOX.
        $request->validate([
            'current_password' => 'required',
            'new_password' => ['required', 'string', Password::default(), 'confirmed', new NotInPasswordHistory($user)],
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'La contraseña actual es incorrecta.',
            ], 422);
        }

        $user->update(['password' => $request->new_password]);
        $user->recordPasswordHistory($user->password);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }
}
