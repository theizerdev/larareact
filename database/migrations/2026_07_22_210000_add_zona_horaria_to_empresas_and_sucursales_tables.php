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
        if (Schema::hasTable('empresas') && !Schema::hasColumn('empresas', 'zona_horaria')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('zona_horaria', 100)->nullable()->after('pais_id');
            });
        }

        if (Schema::hasTable('sucursales') && !Schema::hasColumn('sucursales', 'zona_horaria')) {
            Schema::table('sucursales', function (Blueprint $table) {
                $table->string('zona_horaria', 100)->nullable()->after('empresa_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('empresas') && Schema::hasColumn('empresas', 'zona_horaria')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->dropColumn('zona_horaria');
            });
        }

        if (Schema::hasTable('sucursales') && Schema::hasColumn('sucursales', 'zona_horaria')) {
            Schema::table('sucursales', function (Blueprint $table) {
                $table->dropColumn('zona_horaria');
            });
        }
    }
};
