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
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('control_acceso_base_url')->nullable()->after('google_maps_active');
            $table->string('control_acceso_app_token')->nullable()->after('control_acceso_base_url');
            $table->string('control_acceso_user_token')->nullable()->after('control_acceso_app_token');
            $table->boolean('control_acceso_active')->default(false)->after('control_acceso_user_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'control_acceso_base_url',
                'control_acceso_app_token',
                'control_acceso_user_token',
                'control_acceso_active',
            ]);
        });
    }
};
