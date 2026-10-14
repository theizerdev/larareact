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
        Schema::table('empleados', function (Blueprint $table) {
            $table->boolean('permite_app_movil')->default(false)->after('status');
            $table->unsignedSmallInteger('intervalo_geolocalizacion_minutos')->nullable()->default(15)->after('permite_app_movil');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn(['permite_app_movil', 'intervalo_geolocalizacion_minutos']);
        });
    }
};
