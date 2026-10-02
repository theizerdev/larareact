<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Notifications\Notification;

class NotificationDispatcher
{
    /**
     * Notify every user in the given empresa who holds at least one of the given permissions.
     *
     * Always resolves recipients from the target record's empresa_id explicitly (via
     * withoutTenant()) rather than relying on the acting user's ambient tenant scope,
     * since a super-admin's queries bypass that scope entirely and would otherwise
     * fan a notification out across every company.
     *
     * @param  string|array<int, string>  $permissions
     * @param  array<int, int>  $excludeUserIds
     */
    public static function notifyPermission(string|array $permissions, ?int $empresaId, Notification $notification, array $excludeUserIds = []): void
    {
        if (! $empresaId) {
            return;
        }

        $users = User::withoutTenant()
            ->permission($permissions)
            ->where('empresa_id', $empresaId)
            ->when($excludeUserIds !== [], fn ($query) => $query->whereNotIn('id', $excludeUserIds))
            ->get();

        foreach ($users as $user) {
            $user->notify($notification);
        }
    }
}
