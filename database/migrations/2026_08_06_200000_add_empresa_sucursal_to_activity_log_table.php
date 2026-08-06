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
        if (Schema::hasTable('activity_log')) {
            Schema::table('activity_log', function (Blueprint $table) {
                if (!Schema::hasColumn('activity_log', 'empresa_id')) {
                    $table->unsignedBigInteger('empresa_id')->nullable()->after('log_name')->index();
                }
                if (!Schema::hasColumn('activity_log', 'sucursal_id')) {
                    $table->unsignedBigInteger('sucursal_id')->nullable()->after('empresa_id')->index();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('activity_log')) {
            Schema::table('activity_log', function (Blueprint $table) {
                if (Schema::hasColumn('activity_log', 'empresa_id')) {
                    $table->dropColumn('empresa_id');
                }
                if (Schema::hasColumn('activity_log', 'sucursal_id')) {
                    $table->dropColumn('sucursal_id');
                }
            });
        }
    }
};
