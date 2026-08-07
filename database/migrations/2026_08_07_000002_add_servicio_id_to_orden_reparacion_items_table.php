<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('orden_reparacion_items', 'servicio_id')) {
            Schema::table('orden_reparacion_items', function (Blueprint $table) {
                $table->foreignId('servicio_id')->nullable()->after('producto_id')->constrained('servicios')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('orden_reparacion_items', 'servicio_id')) {
            Schema::table('orden_reparacion_items', function (Blueprint $table) {
                $table->dropForeign(['servicio_id']);
                $table->dropColumn('servicio_id');
            });
        }
    }
};
