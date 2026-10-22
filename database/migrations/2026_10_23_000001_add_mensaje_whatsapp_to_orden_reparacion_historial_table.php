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
        if (Schema::hasTable('orden_reparacion_historial') && !Schema::hasColumn('orden_reparacion_historial', 'mensaje_whatsapp')) {
            Schema::table('orden_reparacion_historial', function (Blueprint $table) {
                $table->longText('mensaje_whatsapp')->nullable()->after('comentario');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('orden_reparacion_historial') && Schema::hasColumn('orden_reparacion_historial', 'mensaje_whatsapp')) {
            Schema::table('orden_reparacion_historial', function (Blueprint $table) {
                $table->dropColumn('mensaje_whatsapp');
            });
        }
    }
};
