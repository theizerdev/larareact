<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;
use App\Traits\PermissionOrganizer;

class RoleController extends Controller
{
    use PermissionOrganizer;

    public function index(Request $request)
    {
        $search = $request->input('search');

        $query = Role::with('users');

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
                    'slug' => str($permission->name)->limit(10, '...')
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
                        ($firstName ? substr($firstName, 0, 1) : '') .
                        ($lastName ? substr($lastName, 0, 1) : '')
                    );
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'initials' => $initials
                    ];
                }),
                'more_users_count' => $moreUsersCount,
                // Permisos para visualización en cards/lista
                'permissions' => $permissionsPreview->map(function ($permission) {
                    return [
                        'id' => $permission->id,
                        'name' => $permission->name,
                        'slug' => str($permission->name)->limit(10, '...')
                    ];
                }),
                'more_permissions_count' => $morePermissionsCount,
                // Todos los permisos para el modal de edición
                'all_permissions' => $allPermissions,
                'is_super_admin' => $role->name === 'Super Admin'
            ];
        });

        $stats = [
            'total' => Role::count(),
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
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name|max:255',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        DB::transaction(function () use ($validated) {
            $role = Role::create(['name' => $validated['name'], 'guard_name' => 'web']);
            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
        });

        return back();
    }

    public function update(Request $request, Role $role)
    {
        // Don't allow changing the name of Super Admin if you want to protect it
        if ($role->name === 'Super Admin' && $request->name !== 'Super Admin') {
            return back()->withErrors(['name' => 'No puedes cambiar el nombre del Super Admin.']);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
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
        if ($role->name === 'Super Admin') {
            return back()->withErrors(['error' => 'No puedes eliminar el rol Super Admin.']);
        }

        $role->delete();
        return back();
    }
}
