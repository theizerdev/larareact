<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ConfiguracionSox;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use App\Notifications\NuevoUsuarioNotification;
use App\Notifications\WelcomeNotification;
use App\Rules\NotInPasswordHistory;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $roleName = $request->input('role');
        $empresaId = $request->input('empresa_id');
        $perPage = $request->input('perPage', 10);
        $actor = $request->user();

        $soxConfig = ConfiguracionSox::current($empresaId);

        $query = $this->visiblesPara($actor, User::with(['empresa', 'sucursal', 'roles', 'paisTelefono']));

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if ($status) {
            $query->where('status', $status);
        }

        if ($empresaId) {
            $query->where('empresa_id', $empresaId);
        }

        if ($roleName) {
            $query->role($roleName);
        }

        $users = $query->latest()->paginate($perPage)->withQueryString();

        // Enrich items with SOX status attributes
        $users->getCollection()->transform(function (User $user) use ($soxConfig) {
            $user->setAttribute('is_locked', $user->isLocked());
            $user->setAttribute('lockout_remaining_minutes', $user->lockoutRemainingMinutes());
            $user->setAttribute('days_remaining', $user->daysUntilPasswordExpires($soxConfig->password_expires_days));
            $user->setAttribute('is_expired', $user->isPasswordExpired($soxConfig->password_expires_days));
            return $user;
        });

        $stats = [
            'total' => $this->visiblesPara($actor, User::query())->count(),
            'activos' => $this->visiblesPara($actor, User::query())->where('status', 'activo')->count(),
            'inactivos' => $this->visiblesPara($actor, User::query())->where('status', 'inactivo')->count(),
        ];

        return inertia('admin/Usuarios/Index', [
            'users' => $users,
            'stats' => $stats,
            'soxPolicies' => [
                'minLength' => $soxConfig->min_password_length,
                'historyLimit' => $soxConfig->password_history_limit,
                'expireDays' => $soxConfig->password_expires_days,
            ],
            'roles' => Role::all(['id', 'name'])
                ->filter(fn ($rol) => $this->nivelDeRol($rol->name) <= $this->nivelDe($actor))->values(),
            'empresas' => Empresa::where('status', true)->orderBy('razon_social')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre')->get(['id', 'nombre', 'empresa_id']),
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']),
            'filters' => $request->only(['search', 'status', 'role', 'empresa_id', 'perPage']),
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizarCorreo($request);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'string', Password::default()],
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'status' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'roles' => 'array',
        ]);

        $validated = $this->guardRoleAndTenantAssignment($request, $validated);


        try {
            $rawPassword = $validated['password'];
            $validated['password'] = Hash::make($rawPassword);
            $validated['password_changed_at'] = now();
            $validated['failed_login_attempts'] = 0;

            $user = User::create($validated);
            $user->recordPasswordHistory($user->password);

            if (isset($validated['roles'])) {
                $user->syncRoles($validated['roles']);
            }

            $user->notify(new WelcomeNotification());

            NotificationDispatcher::notifyPermission(
                'users.view',
                $user->empresa_id,
                new NuevoUsuarioNotification($user, $request->user()->name),
                excludeUserIds: [$user->id, $request->user()->id],
            );

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('User created successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error al crear usuario: '.$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error creating the user. Please try again.'),
            ]);
        }
    }

    public function update(Request $request, User $user)
    {
        $this->guardObjetivo($request, $user);
        $this->normalizarCorreo($request);

        $passwordRules = ['nullable', 'string'];
        if (!empty($request->input('password'))) {
            $passwordRules[] = Password::default();
            $passwordRules[] = new NotInPasswordHistory($user);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => $passwordRules,
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'status' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'roles' => 'array',
        ]);

        $validated = $this->guardRoleAndTenantAssignment($request, $validated);

        if ($request->user()->is($user) && $validated['status'] !== 'activo') {
            throw ValidationException::withMessages([
                'status' => __('You cannot deactivate or delete your own user.'),
            ]);
        }

        try {
            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
                $validated['password_changed_at'] = now();
                $validated['failed_login_attempts'] = 0;
                $validated['locked_until'] = null;
                $user->update($validated);
                $user->recordPasswordHistory($user->password);
            } else {
                unset($validated['password']);
                $user->update($validated);
            }

            if (isset($validated['roles'])) {
                $user->syncRoles($validated['roles']);
            }

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('User updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al actualizar usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the user. Please try again.'),
            ]);
        }
    }

    public function unlock(Request $request, User $user)
    {
        $user->unlock();

        activity('auth')
            ->causedBy($request->user())
            ->performedOn($user)
            ->withProperties([
                'desbloqueado_por' => $request->user()->name,
                'usuario' => $user->email,
            ])
            ->event('sox_user_unlocked')
            ->log("Usuario {$user->name} desbloqueado desde el módulo de usuarios por {$request->user()->name}");

        return back()->with('notification', [
            'type' => 'success',
            'message' => "La cuenta de {$user->name} ha sido desbloqueada exitosamente.",
        ]);
    }

    public function destroy(Request $request, User $user)
    {
        $this->guardObjetivo($request, $user);

        if ($request->user()->is($user)) {
            return $this->errorSobreUnoMismo();
        }

        try {
            $user->delete();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('User deleted successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al eliminar usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error deleting the user. Please try again.'),
            ]);
        }
    }

    public function toggleStatus(Request $request, User $user)
    {
        $this->guardObjetivo($request, $user);

        if ($request->user()->is($user)) {
            return $this->errorSobreUnoMismo();
        }

        try {
            $user->status = $user->status === 'activo' ? 'inactivo' : 'activo';
            $user->save();

            return back()->with('notification', [
                'type' => 'success',
                'message' => __('Status updated successfully.'),
            ]);
        } catch (\Exception $e) {
            Log::error("Error al cambiar estado de usuario {$user->id}: ".$e->getMessage());

            return back()->with('notification', [
                'type' => 'error',
                'message' => __('There was an error updating the status. Please try again.'),
            ]);
        }
    }

    /** Roles del Super Administrador (mismos alias que User::isSuperAdmin). */
    private const ROLES_SUPERADMIN = ['Super Administrador', 'super-admin', 'Super Admin', 'super_admin'];

    /**
     * Jerarquía de roles: super-admin (3) > admin (2) > el resto (1). Quien
     * administra usuarios sólo ve, edita, desactiva o borra a gente de su nivel o
     * menor, y sólo asigna roles de su nivel o menor. Sin esto, cualquiera con
     * "users.edit" (p. ej. un operador) podía quedarse con la cuenta del
     * superadmin, hacerse admin o cambiarle la contraseña a un admin.
     */
    private function nivelDeRol(string $rol): int
    {
        return match (true) {
            in_array($rol, self::ROLES_SUPERADMIN, true) => 3,
            $rol === 'admin' => 2,
            default => 1,
        };
    }

    private function nivelDe(User $user): int
    {
        return $user->roles->map(fn ($rol) => $this->nivelDeRol($rol->name))->max() ?? 1;
    }

    /** Sólo las personas de nivel igual o menor al de quien consulta. */
    private function visiblesPara(User $actor, $query)
    {
        $nivel = $this->nivelDe($actor);

        if ($nivel >= 3) {
            return $query;
        }

        $porEncima = $nivel >= 2 ? self::ROLES_SUPERADMIN : [...self::ROLES_SUPERADMIN, 'admin'];

        return $query->whereDoesntHave('roles', fn ($roles) => $roles->whereIn('name', $porEncima));
    }

    /** Correos en minúsculas y sin espacios, para que `unique` y el inicio de sesión vean lo mismo. */
    private function normalizarCorreo(Request $request): void
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => mb_strtolower(trim($request->input('email')))]);
        }
    }

    /** Con el bloqueo por estado, desactivarse o borrarse a uno mismo lo dejaría fuera. */
    private function errorSobreUnoMismo()
    {
        return back()->with('notification', [
            'type' => 'error',
            'message' => __('You cannot deactivate or delete your own user.'),
        ]);
    }

    private function guardObjetivo(Request $request, User $objetivo): void
    {
        $actor = $request->user();

        abort_if($this->nivelDe($objetivo) > $this->nivelDe($actor), 403);
    }

    /**
     * Prevents privilege escalation and maintains strict tenant isolation.
     */
    private function guardRoleAndTenantAssignment(Request $request, array $validated): array
    {
        $actor = $request->user();

        if (! $actor || $actor->isSuperAdmin()) {
            return $validated;
        }

        $privileged = array_map('strtolower', self::ROLES_SUPERADMIN);

        foreach ($validated['roles'] ?? [] as $role) {
            if (is_string($role) && in_array(strtolower($role), $privileged, true)) {
                throw ValidationException::withMessages([
                    'roles' => __('You are not allowed to assign the super-admin role.'),
                ]);
            }
        }

        $nivel = $this->nivelDe($actor);
        foreach ($validated['roles'] ?? [] as $rol) {
            if ($this->nivelDeRol((string) $rol) > $nivel) {
                throw ValidationException::withMessages([
                    'roles' => __('You are not allowed to assign a role higher than your own.'),
                ]);
            }
        }

        if ($actor->empresa_id) {
            if (! empty($validated['empresa_id']) && (int) $validated['empresa_id'] !== (int) $actor->empresa_id) {
                throw ValidationException::withMessages([
                    'empresa_id' => __('You are not allowed to assign this company.'),
                ]);
            }
            $validated['empresa_id'] = $actor->empresa_id;
        }

        if ($actor->sucursal_id) {
            if (! empty($validated['sucursal_id']) && (int) $validated['sucursal_id'] !== (int) $actor->sucursal_id) {
                throw ValidationException::withMessages([
                    'sucursal_id' => __('You are not allowed to assign this branch.'),
                ]);
            }
            $validated['sucursal_id'] = $actor->sucursal_id;
        }

        return $validated;
    }
}
