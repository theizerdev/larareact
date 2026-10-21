<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class GroupController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = Group::with(['roles.permissions', 'users:id,name,email']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status === 'activo' || $status === '1');
        }

        $perPage = $request->input('perPage', 10);
        $groups = $query->latest()->paginate($perPage)->withQueryString();

        $groups->getCollection()->transform(function (Group $group) {
            return [
                'id' => $group->id,
                'name' => $group->name,
                'slug' => $group->slug,
                'description' => $group->description,
                'status' => (bool) $group->status,
                'users_count' => $group->users->count(),
                'roles_count' => $group->roles->count(),
                'roles' => $group->roles->map(fn ($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'permissions_count' => $r->permissions->count(),
                ]),
                'users' => $group->users->take(5)->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                ]),
                'more_users_count' => max(0, $group->users->count() - 5),
                'created_at' => $group->created_at?->format('d/m/Y H:i'),
            ];
        });

        $stats = [
            'total' => Group::count(),
            'activos' => Group::where('status', true)->count(),
            'inactivos' => Group::where('status', false)->count(),
            'total_users' => User::has('groups')->count(),
        ];

        return inertia('admin/Grupos/Index', [
            'groups' => $groups,
            'stats' => $stats,
            'availableRoles' => Role::withCount('permissions')->get(['id', 'name']),
            'availableUsers' => User::where('status', 'activo')->get(['id', 'name', 'email']),
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:groups,name',
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
            'users' => 'nullable|array',
            'users.*' => 'exists:users,id',
        ]);

        $group = Group::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? true,
        ]);

        if (!empty($validated['roles'])) {
            $group->roles()->sync($validated['roles']);
        }

        if (!empty($validated['users'])) {
            $group->users()->sync($validated['users']);
        }

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Group created successfully.'),
        ]);
    }

    public function update(Request $request, Group $grupo)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('groups', 'name')->ignore($grupo->id)],
            'description' => 'nullable|string|max:1000',
            'status' => 'boolean',
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,id',
            'users' => 'nullable|array',
            'users.*' => 'exists:users,id',
        ]);

        $grupo->update([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? true,
        ]);

        $grupo->roles()->sync($validated['roles'] ?? []);
        $grupo->users()->sync($validated['users'] ?? []);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Group updated successfully.'),
        ]);
    }

    public function toggleStatus(Group $grupo)
    {
        $grupo->update(['status' => !$grupo->status]);

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Group status updated successfully.'),
        ]);
    }

    public function destroy(Group $grupo)
    {
        $grupo->delete();

        return back()->with('notification', [
            'type' => 'success',
            'message' => __('Group deleted successfully.'),
        ]);
    }
}
