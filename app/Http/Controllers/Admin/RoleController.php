<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Traits\PermissionOrganizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    use PermissionOrganizer;

    public function index(Request $request)
    {
        $search = $request->input('search');
        $user = auth()->user();
        $isSuperAdmin = $this->isSuperAdmin($user);
        $empresaId = $user?->empresa_id;

        $query = Role::with('users');

        if (! $isSuperAdmin) {
            $query->whereNotIn('name', ['Super Administrador', 'super-admin', 'Super Admin']);

            if ($empresaId === 1) {
                $query->where(function ($q) {
                    $q->where('empresa_id', 1)
                      ->orWhereNull('empresa_id');
                });
            } else {
                if ($empresaId) {
                    $hasTenantRoles = Role::where('empresa_id', $empresaId)->exists();
                    if (! $hasTenantRoles) {
                        setPermissionsTeamId($empresaId);
                        $adminRole = Role::firstOrCreate([
                            'name' => 'Administrador',
                            'guard_name' => 'web',
                            'empresa_id' => $empresaId,
                        ]);
                        $adminRole->syncPermissions(
                            Permission::where('module', '!=', 'roles')
                                ->where('name', '!=', 'subscriptions.manage')
                                ->get()
                        );
                        if ($user && ! $user->hasRole('Administrador')) {
                            $user->assignRole($adminRole);
                        }
                    }
                }

                $query->where('empresa_id', $empresaId);
            }
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $roles = $query->get()->map(function ($role) {
            $users = $role->users->take(5); // Tomar los primeros 5 usuarios para mostrar en cards
            $moreUsersCount = $role->users->count() - $users->count();

            // Para las cards: solo primeros 3 permisos para visualización
            $permissionsPreview = $role->permissions->take(3);
            $morePermissionsCount = $role->permissions->count() - $permissionsPreview->count();

            // Para el modal: TODOS los permisos para que se muestren seleccionados
            $allPermissions = $role->permissions->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'slug' => str($permission->name)->limit(10, '...'),
                ];
            });

            return [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users->count(),
                'permissions_count' => $role->permissions->count(),
                'users' => $users->map(function ($user) {
                    $nameParts = explode(' ', $user->name, 2);
                    $firstName = $nameParts[0] ?? '';
                    $lastName = $nameParts[1] ?? '';
                    $initials = strtoupper(
                        ($firstName ? substr($firstName, 0, 1) : '').
                        ($lastName ? substr($lastName, 0, 1) : '')
                    );

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'initials' => $initials,
                    ];
                }),
                'more_users_count' => $moreUsersCount,
                // Permisos para visualización en cards/lista
                'permissions' => $permissionsPreview->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => str($permission->name)->limit(10, '...'),
                    ];
                }),
                'more_permissions_count' => $morePermissionsCount,
                // Todos los permisos para el modal de edición
                'all_permissions' => $allPermissions,
                'is_super_admin' => $role->name === 'Super Admin' || $role->name === 'Super Administrador',
            ];
        });

        $stats = [
            'total' => count($roles),
            'permissions_total' => Permission::count(),
        ];

        $groupedPermissions = $this->getPermissionsBySector();

        return inertia('admin/Roles/Index', [
            'roles' => $roles,
            'stats' => $stats,
            'groupedPermissions' => $groupedPermissions,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('roles', 'name')->where('empresa_id', $empresaId),
            ],
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        DB::transaction(function () use ($validated, $empresaId) {
            $role = Role::create([
                'name' => $validated['name'],
                'guard_name' => 'web',
                'empresa_id' => $empresaId,
            ]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
        });

        return back();
    }

    public function update(Request $request, Role $role)
    {
        $user = auth()->user();
        $empresaId = $user?->empresa_id;

        if (in_array($role->name, ['Super Admin', 'Super Administrador'])) {
            return back()->withErrors(['name' => 'No puedes cambiar el nombre del Super Administrador.']);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                \Illuminate\Validation\Rule::unique('roles', 'name')
                    ->where('empresa_id', $empresaId)
                    ->ignore($role->id),
            ],
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $role->update(['name' => $validated['name']]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            } else {
                $role->syncPermissions([]); // Clear if none selected
            }
        });

        return back();
    }

    public function destroy(Role $role)
    {
        if (in_array($role->name, ['Super Admin', 'Super Administrador'])) {
            return back()->withErrors(['error' => 'No puedes eliminar el rol Super Administrador.']);
        }

        $role->delete();

        return back();
    }
}
