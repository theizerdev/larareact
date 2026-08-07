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
        Schema::table('ordenes_reparacion', function (Blueprint $table) {
            if (!Schema::hasColumn('ordenes_reparacion', 'contrasena_patron')) {
                $table->string('contrasena_patron')->nullable()->after('observaciones_fisicas');
            }
            if (!Schema::hasColumn('ordenes_reparacion', 'inspeccion_json')) {
                $table->json('inspeccion_json')->nullable()->after('contrasena_patron');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ordenes_reparacion', function (Blueprint $table) {
            if (Schema::hasColumn('ordenes_reparacion', 'contrasena_patron')) {
                $table->dropColumn('contrasena_patron');
            }
            if (Schema::hasColumn('ordenes_reparacion', 'inspeccion_json')) {
                $table->dropColumn('inspeccion_json');
            }
        });
    }
};
