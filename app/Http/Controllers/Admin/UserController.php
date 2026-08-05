<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\Empresa;
use App\Models\Pais;
use App\Models\Sucursal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $roleName = $request->input('role');
        $empresaId = $request->input('empresa_id');
        $sucursalId = $request->input('sucursal_id');
        $perPage = $request->input('perPage', 10);

        $query = User::with(['empresa', 'sucursal', 'roles', 'paisTelefono']);

        $currentUser = auth()->user();
        if ($currentUser && ! $currentUser->hasRole('Super Administrador') && ! $currentUser->hasRole('super-admin')) {
            if ($currentUser->empresa_id) {
                $query->where('empresa_id', $currentUser->empresa_id);
            }
        }

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

        if ($empresaId && ($currentUser->hasRole('Super Administrador') || $currentUser->hasRole('super-admin'))) {
            $query->where('empresa_id', $empresaId);
        }

        if ($sucursalId) {
            $query->where('sucursal_id', $sucursalId);
        }

        if ($roleName) {
            $query->role($roleName);
        }

        $users = $query->latest()->paginate($perPage)->withQueryString();

        $statsQuery = User::query();
        if ($currentUser && ! $currentUser->hasRole('Super Administrador') && ! $currentUser->hasRole('super-admin')) {
            if ($currentUser->empresa_id) {
                $statsQuery->where('empresa_id', $currentUser->empresa_id);
            }
        }

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'activos' => (clone $statsQuery)->where('status', 'activo')->count(),
            'inactivos' => (clone $statsQuery)->where('status', 'inactivo')->count(),
            'verificados' => (clone $statsQuery)->where(function ($q) {
                $q->whereNotNull('whatsapp_verified_at')
                  ->orWhereNotNull('email_verified_at');
            })->count(),
        ];

        return inertia('admin/Usuarios/Index', [
            'users' => $users,
            'stats' => $stats,
            'roles' => Role::whereNotIn('name', ['Super Administrador', 'super-admin', 'Super Admin'])
                ->orderBy('name')
                ->get(['id', 'name']),
            'empresas' => Empresa::where('status', true)->orderBy('razon_social')->get(['id', 'razon_social']),
            'sucursales' => Sucursal::where('status', true)->orderBy('nombre')->get(['id', 'nombre', 'empresa_id']),
            'paises' => Pais::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'codigo_iso2', 'codigo_telefonico']),
            'filters' => $request->only(['search', 'status', 'role', 'empresa_id', 'sucursal_id', 'perPage']),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        try {
            $currentUser = auth()->user();
            if ($currentUser && ! $currentUser->hasRole('Super Administrador') && ! $currentUser->hasRole('super-admin')) {
                if (empty($validated['empresa_id'])) {
                    $validated['empresa_id'] = $currentUser->empresa_id;
                }
                if (empty($validated['sucursal_id'])) {
                    $validated['sucursal_id'] = $currentUser->sucursal_id;
                }
            }

            $validated['password'] = Hash::make($validated['password']);
            $user = User::create($validated);

            if (isset($validated['roles'])) {
                $user->syncRoles($validated['roles']);
            }

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

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

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
}
