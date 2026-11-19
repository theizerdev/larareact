<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\PermissionSyncService;
use App\Traits\PermissionOrganizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    use PermissionOrganizer;

    public const SYSTEM_ROLE_NAMES = [
        'Super Administrador',
        'super-admin',
        'Super Admin',
        'super_admin',
        'admin',
        'operador',
        'encargado',
        'viewer',
        'cliente',
    ];

    public function index(Request $request, PermissionSyncService $syncService)
    {
        $search = trim((string) $request->input('search', ''));
        $filter = (string) $request->input('filter', 'all');
        $sortBy = (string) $request->input('sortBy', 'name');
        $sortDir = strtolower((string) $request->input('sortDir', 'asc')) === 'desc' ? 'desc' : 'asc';

        $query = Role::with(['users:id,name,email', 'permissions'])
            ->withCount(['users', 'permissions']);

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('permissions', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('slug', 'like', "%{$search}%");
                    });
            });
        }

        match ($filter) {
            'with_users' => $query->has('users'),
            'without_users' => $query->doesntHave('users'),
            'system' => $query->whereIn('name', self::SYSTEM_ROLE_NAMES),
            'custom' => $query->whereNotIn('name', self::SYSTEM_ROLE_NAMES),
            default => null,
        };

        match ($sortBy) {
            'users_count' => $query->orderBy('users_count', $sortDir)->orderBy('name', 'asc'),
            'permissions_count' => $query->orderBy('permissions_count', $sortDir)->orderBy('name', 'asc'),
            'updated_at' => $query->orderBy('updated_at', $sortDir)->orderBy('name', 'asc'),
            default => $query->orderBy('name', $sortDir),
        };

        $sectorMeta = $syncService->sectorMeta();
        $moduleMeta = $syncService->moduleMeta();

        $allSystemPermissions = Permission::where('guard_name', 'web')
            ->orderBy('module')
            ->orderBy('id')
            ->get();

        $totalPermissions = $allSystemPermissions->count();

        $sectorTotals = $allSystemPermissions
            ->groupBy(fn (Permission $p) => $p->sector ?: 'sistema')
            ->map(fn ($group) => $group->count());

        $orderedSectorKeys = collect(array_keys($sectorMeta))
            ->merge($sectorTotals->keys())
            ->unique()
            ->sortBy(fn ($k) => sprintf('%03d_%s', $sectorMeta[$k]['order'] ?? 500, $k))
            ->values();

        $roles = $query->get()->map(function (Role $role) use ($totalPermissions, $sectorTotals, $sectorMeta, $orderedSectorKeys, $allSystemPermissions) {
            $isSuperAdmin = $this->isSuperAdminRole($role);
            $effectivePermissions = $isSuperAdmin ? $allSystemPermissions : $role->permissions;

            $usersTotal = (int) ($role->users_count ?? $role->users->count());
            $usersPreview = $role->users->take(5);
            $moreUsersCount = max(0, $usersTotal - $usersPreview->count());

            $permsTotal = $isSuperAdmin ? $totalPermissions : $role->permissions->count();
            $coveragePercent = $isSuperAdmin
                ? 100
                : ($totalPermissions > 0 ? (int) round(($permsTotal / $totalPermissions) * 100) : 0);

            $permissionsPreview = $effectivePermissions->take(4);
            $morePermissionsCount = max(0, $effectivePermissions->count() - $permissionsPreview->count());

            $rolePermsBySector = $effectivePermissions->groupBy(fn (Permission $p) => $p->sector ?: 'sistema');
            $sectorBreakdown = [];

            foreach ($orderedSectorKeys as $sectorKey) {
                $totalInSector = (int) ($sectorTotals->get($sectorKey) ?? 0);
                if ($totalInSector === 0) {
                    continue;
                }

                $countInRole = $isSuperAdmin
                    ? $totalInSector
                    : ($rolePermsBySector->get($sectorKey)?->count() ?? 0);

                $sectorBreakdown[] = [
                    'sector' => $sectorKey,
                    'label' => $sectorMeta[$sectorKey]['label'] ?? ucfirst(str_replace('_', ' ', $sectorKey)),
                    'count' => $countInRole,
                    'total' => $totalInSector,
                ];
            }

            $mapPerm = fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'slug' => $permission->slug ?: $permission->name,
                'sector' => $permission->sector ?: 'sistema',
                'module' => $permission->module ?: 'general',
            ];

            return [
                'id' => $role->id,
                'name' => $role->name,
                'users_count' => $usersTotal,
                'permissions_count' => $permsTotal,
                'coverage_percent' => $coveragePercent,
                'updated_at_human' => $role->updated_at?->diffForHumans() ?? '—',
                'created_at' => $role->created_at?->format('d/m/Y') ?? '—',
                'users' => $usersPreview->map(function ($user) {
                    $nameParts = preg_split('/\s+/', trim((string) $user->name), 2);
                    $firstName = $nameParts[0] ?? '';
                    $lastName = $nameParts[1] ?? '';
                    $initials = mb_strtoupper(
                        ($firstName !== '' ? mb_substr($firstName, 0, 1) : '') .
                        ($lastName !== '' ? mb_substr($lastName, 0, 1) : '')
                    );

                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'initials' => $initials ?: 'U',
                    ];
                })->values(),
                'more_users_count' => $moreUsersCount,
                'permissions' => $permissionsPreview->map($mapPerm)->values(),
                'more_permissions_count' => $morePermissionsCount,
                'all_permissions' => $effectivePermissions->map($mapPerm)->values(),
                'sector_breakdown' => $sectorBreakdown,
                'is_super_admin' => $isSuperAdmin,
                'is_system' => in_array($role->name, self::SYSTEM_ROLE_NAMES, true),
            ];
        })->values();

        $assignedUsersCount = (int) DB::table(config('permission.table_names.model_has_roles', 'model_has_roles'))
            ->distinct()
            ->count('model_id');

        $groupedPermissions = $this->getPermissionsBySector();

        $stats = [
            'total' => Role::count(),
            'permissions_total' => $totalPermissions,
            'assigned_users' => $assignedUsersCount,
            'sectors_count' => $groupedPermissions->count(),
            'modules_count' => $allSystemPermissions->pluck('module')->filter()->unique()->count(),
        ];

        $user = $request->user();

        return inertia('admin/Roles/Index', [
            'roles' => $roles,
            'stats' => $stats,
            'groupedPermissions' => $groupedPermissions,
            'sectorMeta' => $sectorMeta,
            'moduleMeta' => $moduleMeta,
            'syncStatus' => $syncService->inspect(),
            'filters' => [
                'search' => $search,
                'filter' => $filter,
                'sortBy' => $sortBy,
                'sortDir' => $sortDir,
            ],
            'can' => [
                'create' => $user ? ($user->isSuperAdmin() || $user->can('roles.create')) : false,
                'edit' => $user ? ($user->isSuperAdmin() || $user->can('roles.edit')) : false,
                'delete' => $user ? ($user->isSuperAdmin() || $user->can('roles.delete')) : false,
            ],
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
            $role = Role::create(['name' => trim($validated['name']), 'guard_name' => 'web']);
            if (isset($validated['permissions'])) {
                $role->syncPermissions($validated['permissions']);
            }
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Role created successfully.'),
        ]);
    }

    public function update(Request $request, Role $role)
    {
        if ($this->isSuperAdminRole($role)) {
            return back()->withErrors(['name' => 'El rol Super Admin está protegido y no puede modificarse.']);
        }

        if ($this->isReservedName($request->input('name', ''))) {
            return back()->withErrors(['name' => __('No se permite asignar nombres reservados de super administrador.')]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        DB::transaction(function () use ($role, $validated) {
            $role->update(['name' => trim($validated['name'])]);
            $role->syncPermissions($validated['permissions'] ?? []);
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Role updated successfully.'),
        ]);
    }

    public function duplicate(Role $role)
    {
        $baseName = trim($role->name) . ' (Copia)';
        $candidateName = $baseName;
        $suffix = 2;

        while (Role::where('name', $candidateName)->exists() || $this->isReservedName($candidateName)) {
            $candidateName = trim($role->name) . " (Copia {$suffix})";
            $suffix++;
        }

        $cloned = DB::transaction(function () use ($role, $candidateName) {
            $newRole = Role::create(['name' => $candidateName, 'guard_name' => 'web']);
            $permissions = $this->isSuperAdminRole($role)
                ? Permission::where('guard_name', 'web')->get()
                : $role->permissions;
            $newRole->syncPermissions($permissions);

            return $newRole;
        });

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Rol duplicado como \"{$cloned->name}\".",
        ]);
    }

    public function syncPermissions(Request $request, PermissionSyncService $syncService)
    {
        $validated = $request->validate([
            'prune_obsolete' => 'sometimes|boolean',
            'sync_super_admin' => 'sometimes|boolean',
        ]);

        $summary = $syncService->sync(
            pruneObsolete: (bool) ($validated['prune_obsolete'] ?? false),
            syncSuperAdmin: (bool) ($validated['sync_super_admin'] ?? true),
        );

        $parts = [];
        if ($summary['created'] > 0) {
            $parts[] = "{$summary['created']} nuevos";
        }
        if ($summary['updated'] > 0) {
            $parts[] = "{$summary['updated']} actualizados";
        }
        if ($summary['pruned'] > 0) {
            $parts[] = "{$summary['pruned']} obsoletos eliminados";
        }
        if ($summary['super_admin_synced'] > 0) {
            $parts[] = 'Super Admin actualizado';
        }

        $detail = count($parts) > 0 ? implode(', ', $parts) : 'catálogo verificado y caché limpia';

        return back()->with('notification', [
            'type' => 'success',
            'message' => "Permisos sincronizados ({$detail}). Total en sistema: {$summary['total']}.",
        ]);
    }

    public function destroy(Role $role)
    {
        if ($this->isSuperAdminRole($role)) {
            return back()->withErrors(['error' => 'No puedes eliminar el rol Super Admin.']);
        }

        $role->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Role deleted successfully.'),
        ]);
    }

    private function isSuperAdminRole(Role $role): bool
    {
        return in_array($role->name, PermissionSyncService::SUPER_ADMIN_ROLES, true);
    }

    private function isReservedName(string $name): bool
    {
        return in_array(strtolower(trim($name)), ['super administrador', 'super-admin', 'super admin', 'super_admin'], true);
    }
}
