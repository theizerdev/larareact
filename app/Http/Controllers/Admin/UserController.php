<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use App\Notifications\NuevoUsuarioNotification;
use App\Notifications\WelcomeNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
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

        $query = User::with(['empresa', 'sucursal', 'roles', 'paisTelefono']);

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

        $stats = [
            'total' => User::count(),
            'activos' => User::where('status', 'activo')->count(),
            'inactivos' => User::where('status', 'inactivos')->count(),
        ];

        return inertia('admin/Usuarios/Index', [
            'users' => $users,
            'stats' => $stats,
            'roles' => Role::all(['id', 'name']),
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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'status' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'roles' => 'array',
        ]);

        $this->guardRoleAndTenantAssignment($request, $validated);

        try {
            $validated['password'] = Hash::make($validated['password']);
            $user = User::create($validated);

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
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'username' => ['nullable', 'string', 'max:255', Rule::unique('users', 'username')->ignore($user->id)],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'telefono' => 'nullable|string|max:255',
            'pais_telefono_id' => 'nullable|exists:pais,id',
            'status' => ['required', Rule::in(['activo', 'inactivo', 'suspendido'])],
            'empresa_id' => 'nullable|exists:empresas,id',
            'sucursal_id' => 'nullable|exists:sucursales,id',
            'roles' => 'array',
        ]);

        $this->guardRoleAndTenantAssignment($request, $validated);

        try {
            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

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

    public function destroy(User $user)
    {
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

    public function toggleStatus(User $user)
    {
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

    /**
     * `roles` had no restriction on which roles could be assigned, and
     * empresa_id/sucursal_id only checked exists:*. Confirmed in QA testing
     * (2026-08-21): a zero-permission account granted itself "super-admin"
     * via a normal PUT to this endpoint. Non-super-admins can no longer
     * grant/keep the super-admin role, and are pinned to their own
     * empresa/sucursal exactly like the other tenant-scoped modules.
     */
    private function guardRoleAndTenantAssignment(Request $request, array $validated): void
    {
        $actor = $request->user();

        if (! $actor || $actor->isSuperAdmin()) {
            return;
        }

        if (in_array('super-admin', $validated['roles'] ?? [], true)) {
            throw ValidationException::withMessages([
                'roles' => __('You are not allowed to assign the super-admin role.'),
            ]);
        }

        if ($actor->empresa_id && array_key_exists('empresa_id', $validated)
            && $validated['empresa_id'] && (int) $validated['empresa_id'] !== (int) $actor->empresa_id) {
            throw ValidationException::withMessages([
                'empresa_id' => __('You are not allowed to assign this company.'),
            ]);
        }

        if ($actor->sucursal_id && array_key_exists('sucursal_id', $validated)
            && $validated['sucursal_id'] && (int) $validated['sucursal_id'] !== (int) $actor->sucursal_id) {
            throw ValidationException::withMessages([
                'sucursal_id' => __('You are not allowed to assign this branch.'),
            ]);
        }
    }
}
