<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Collection;
use Spatie\Permission\Contracts\Permission;
use Spatie\Permission\Contracts\Role;

trait HasGroupRoles
{
    /**
     * Get all roles, combining direct roles with inherited group roles.
     */
    public function getAllRoles(): Collection
    {
        $directRoles = $this->roles;

        if ($this->group) {
            $groupRoles = $this->group->roles;
            $directRoles = $directRoles->merge($groupRoles);
        }

        return $directRoles->unique('id')->values();
    }

    /**
     * Get roles inherited from the user's group.
     */
    public function getGroupRoles(): Collection
    {
        if (! $this->group) {
            return new Collection;
        }

        return $this->group->roles;
    }

    /**
     * Get permissions inherited from the user's group (via group roles).
     */
    public function getGroupPermissions(): Collection
    {
        if (! $this->group) {
            return new Collection;
        }

        return $this->group->getAllPermissions();
    }

    /**
     * Check if the user has the given role (direct or inherited from group).
     *
     * @param  string|int|\Spatie\Permission\Contracts\Role|\Illuminate\Database\Eloquent\Collection  $roles
     * @param  string|null  $guard
     */
    public function hasRole($roles, ?string $guard = null): bool
    {
        $allRoles = $this->getAllRoles();

        if (is_string($roles) && str_contains($roles, '|')) {
            $roles = explode('|', $roles);
        }

        if (is_string($roles)) {
            return $allRoles->contains('name', $roles);
        }

        if ($roles instanceof Role) {
            return $allRoles->contains('id', $roles->id);
        }

        if (is_int($roles)) {
            return $allRoles->contains('id', $roles);
        }

        if (is_array($roles)) {
            foreach ($roles as $role) {
                if ($this->hasRole($role, $guard)) {
                    return true;
                }
            }

            return false;
        }

        return $allRoles->intersect($roles)->isNotEmpty();
    }

    /**
     * Check if the user has any of the given roles.
     *
     * @param  string|array|\Illuminate\Database\Eloquent\Collection  $roles
     * @param  string|null  $guard
     */
    public function hasAnyRole($roles, ?string $guard = null): bool
    {
        if (is_string($roles) && str_contains($roles, '|')) {
            $roles = explode('|', $roles);
        }

        if (is_string($roles)) {
            return $this->getAllRoles()->contains('name', $roles);
        }

        if ($roles instanceof Collection) {
            $roles = $roles->all();
        }

        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if ($this->hasRole($role, $guard)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the user has all of the given roles.
     *
     * @param  string|array|\Illuminate\Database\Eloquent\Collection  $roles
     * @param  string|null  $guard
     */
    public function hasAllRoles($roles, ?string $guard = null): bool
    {
        if (is_string($roles) && str_contains($roles, '|')) {
            $roles = explode('|', $roles);
        }

        if (is_string($roles)) {
            return $this->getAllRoles()->contains('name', $roles);
        }

        if ($roles instanceof Collection) {
            $roles = $roles->all();
        }

        $roles = is_array($roles) ? $roles : [$roles];

        foreach ($roles as $role) {
            if (! $this->hasRole($role, $guard)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if the user has the given permission (direct or inherited from group).
     *
     * @param  string|int|\Spatie\Permission\Contracts\Permission  $permission
     * @param  string|null  $guard
     */
    public function hasPermissionTo($permission, ?string $guard = null): bool
    {
        // Check direct permissions via Spatie
        if ($this->spatieHasPermissionTo($permission, $guard)) {
            return true;
        }

        // Check permissions via group roles
        $permissionName = is_string($permission) ? $permission : $permission->name;

        $groupPermissions = $this->getGroupPermissions();

        return $groupPermissions->contains('name', $permissionName);
    }

    /**
     * Check if the user has any of the given permissions.
     *
     * @param  string|array|\Illuminate\Database\Eloquent\Collection  $permissions
     * @param  string|null  $guard
     */
    public function hasAnyPermission($permissions, ?string $guard = null): bool
    {
        if (is_string($permissions) && str_contains($permissions, '|')) {
            $permissions = explode('|', $permissions);
        }

        if (is_string($permissions)) {
            return $this->hasPermissionTo($permissions, $guard);
        }

        if ($permissions instanceof Collection) {
            $permissions = $permissions->all();
        }

        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            if ($this->hasPermissionTo($permission, $guard)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if the user has all of the given permissions.
     *
     * @param  string|array|\Illuminate\Database\Eloquent\Collection  $permissions
     * @param  string|null  $guard
     */
    public function hasAllPermissions($permissions, ?string $guard = null): bool
    {
        if (is_string($permissions) && str_contains($permissions, '|')) {
            $permissions = explode('|', $permissions);
        }

        if (is_string($permissions)) {
            return $this->hasPermissionTo($permissions, $guard);
        }

        if ($permissions instanceof Collection) {
            $permissions = $permissions->all();
        }

        $permissions = is_array($permissions) ? $permissions : [$permissions];

        foreach ($permissions as $permission) {
            if (! $this->hasPermissionTo($permission, $guard)) {
                return false;
            }
        }

        return true;
    }
}
