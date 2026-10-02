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
            if (!Schema::hasColumn('empleados', 'tarjeta_acceso_1')) {
                $table->string('tarjeta_acceso_1')->default('0')->nullable()->after('codigo_acceso');
            }
            if (!Schema::hasColumn('empleados', 'tarjeta_acceso_2')) {
                $table->string('tarjeta_acceso_2')->default('0')->nullable()->after('tarjeta_acceso_1');
            }
            if (!Schema::hasColumn('empleados', 'tarjeta_acceso_3')) {
                $table->string('tarjeta_acceso_3')->default('0')->nullable()->after('tarjeta_acceso_2');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn(['tarjeta_acceso_1', 'tarjeta_acceso_2', 'tarjeta_acceso_3']);
        });
    }
};
