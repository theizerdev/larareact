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

        $query = Role::with(['users', 'permissions'])->orderBy('name');

        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        $formatPermission = fn ($permission) => [
            'id' => $permission->id,
            'name' => $permission->name,
            'slug' => $permission->slug ?: $permission->name,
            'module' => $permission->module,
            'sector' => $permission->sector,
        ];

        $roles = $query->get()->map(function ($role) use ($formatPermission) {
            $users = $role->users->take(5);
            $moreUsersCount = $role->users->count() - $users->count();

            $permissionsPreview = $role->permissions->take(3);
            $morePermissionsCount = $role->permissions->count() - $permissionsPreview->count();

            return [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $role->users->count(),
                'permissions_count' => $role->permissions->count(),
                'users' => $users->map(function ($user) {
                    $nameParts = explode(' ', trim($user->name), 2);
                    $firstName = $nameParts[0] ?? '';
                    $lastName = $nameParts[1] ?? '';
                    $initials = mb_strtoupper(
                        ($firstName ? mb_substr($firstName, 0, 1) : '').
                        ($lastName ? mb_substr($lastName, 0, 1) : '')
                    );

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'initials' => $initials,
                    ];
                })->values(),
                'more_users_count' => $moreUsersCount,
                'permissions' => $permissionsPreview->map($formatPermission)->values(),
                'more_permissions_count' => $morePermissionsCount,
                'all_permissions' => $role->permissions->map($formatPermission)->values(),
                'sector_counts' => $role->permissions->groupBy('sector')->map->count(),
                'is_super_admin' => $this->isSuperAdminRole($role),
                'created_at' => $role->created_at?->toIso8601String(),
            ];
        });

        $stats = [
            'total' => Role::count(),
            'permissions_total' => Permission::count(),
            'users_with_roles' => DB::table(config('permission.table_names.model_has_roles', 'model_has_roles'))
                ->distinct()
                ->count('model_id'),
            'roles_without_users' => Role::doesntHave('users')->count(),
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
        if ($this->isReservedName($request->input('name', ''))) {
            return back()->withErrors(['name' => __('No se permite crear roles con nombres reservados de super administrador.')]);
        }

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
        if ($this->isSuperAdminRole($role) && $request->name !== $role->name) {
            return back()->withErrors(['name' => 'No puedes cambiar el nombre del Super Admin.']);
        }

        if ($this->isReservedName($request->input('name', '')) && ! $this->isSuperAdminRole($role)) {
            return back()->withErrors(['name' => __('No se permite asignar nombres reservados de super administrador.')]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $role->update(['name' => $validated['name']]);

            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            } elseif (! $this->isSuperAdminRole($role)) {
                $role->syncPermissions([]); // Clear if none selected only for non-superadmin
            }
        });

        return back();
    }

    public function destroy(Role $role)
    {
        if ($this->isSuperAdminRole($role)) {
            return back()->withErrors(['error' => 'No puedes eliminar el rol Super Admin.']);
        }

        $role->delete();

        return back();
    }

    private function isSuperAdminRole(Role $role): bool
    {
        return in_array($role->name, ['Super Administrador', 'super-admin', 'Super Admin', 'super_admin'], true);
    }

    private function isReservedName(string $name): bool
    {
        return in_array(strtolower(trim($name)), ['super administrador', 'super-admin', 'super admin', 'super_admin'], true);
    }
}
