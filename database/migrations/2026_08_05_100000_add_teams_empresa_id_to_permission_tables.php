<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');
        $teamForeignKey = $columnNames['team_foreign_key'] ?? 'empresa_id';

        if (Schema::hasTable($tableNames['roles']) && ! Schema::hasColumn($tableNames['roles'], $teamForeignKey)) {
            Schema::table($tableNames['roles'], function (Blueprint $table) use ($teamForeignKey) {
                $table->unsignedBigInteger($teamForeignKey)->nullable()->after('id');
                $table->index($teamForeignKey, 'roles_team_foreign_key_index');
            });
        }

        if (Schema::hasTable($tableNames['model_has_roles']) && ! Schema::hasColumn($tableNames['model_has_roles'], $teamForeignKey)) {
            Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($teamForeignKey) {
                $table->unsignedBigInteger($teamForeignKey)->nullable()->after('role_id');
                $table->index($teamForeignKey, 'model_has_roles_team_foreign_key_index');
            });
        }

        if (Schema::hasTable($tableNames['model_has_permissions']) && ! Schema::hasColumn($tableNames['model_has_permissions'], $teamForeignKey)) {
            Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($teamForeignKey) {
                $table->unsignedBigInteger($teamForeignKey)->nullable()->after('permission_id');
                $table->index($teamForeignKey, 'model_has_permissions_team_foreign_key_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');
        $teamForeignKey = $columnNames['team_foreign_key'] ?? 'empresa_id';

        if (Schema::hasTable($tableNames['roles']) && Schema::hasColumn($tableNames['roles'], $teamForeignKey)) {
            Schema::table($tableNames['roles'], function (Blueprint $table) use ($teamForeignKey) {
                $table->dropColumn($teamForeignKey);
            });
        }

        if (Schema::hasTable($tableNames['model_has_roles']) && Schema::hasColumn($tableNames['model_has_roles'], $teamForeignKey)) {
            Schema::table($tableNames['model_has_roles'], function (Blueprint $table) use ($teamForeignKey) {
                $table->dropColumn($teamForeignKey);
            });
        }

        if (Schema::hasTable($tableNames['model_has_permissions']) && Schema::hasColumn($tableNames['model_has_permissions'], $teamForeignKey)) {
            Schema::table($tableNames['model_has_permissions'], function (Blueprint $table) use ($teamForeignKey) {
                $table->dropColumn($teamForeignKey);
            });
        }
    }
};
