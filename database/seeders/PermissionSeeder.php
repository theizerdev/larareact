<?php

namespace Database\Seeders;

use App\Services\PermissionSyncService;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Seed the permissions using the canonical catalog + route discovery.
     */
    public function run(): void
    {
        app(PermissionSyncService::class)->sync(pruneObsolete: false, syncSuperAdmin: false);
    }
}
