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
        Schema::table('reparacion_checklist_items', function (Blueprint $table) {
            if (! Schema::hasColumn('reparacion_checklist_items', 'sucursal_id')) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            }
            if (! Schema::hasColumn('reparacion_checklist_items', 'seccion')) {
                $table->string('seccion')->default('validacion')->after('sucursal_id');
            }
            if (! Schema::hasColumn('reparacion_checklist_items', 'descripcion')) {
                $table->string('descripcion')->nullable()->after('nombre');
            }
            if (! Schema::hasColumn('reparacion_checklist_items', 'icono')) {
                $table->string('icono')->nullable()->after('descripcion');
            }
            if (! Schema::hasColumn('reparacion_checklist_items', 'is_default')) {
                $table->boolean('is_default')->default(false)->after('activo');
            }
            if (Schema::hasColumn('reparacion_checklist_items', 'categoria')) {
                $table->dropColumn('categoria');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reparacion_checklist_items', function (Blueprint $table) {
            if (Schema::hasColumn('reparacion_checklist_items', 'sucursal_id')) {
                $table->dropForeign(['sucursal_id']);
                $table->dropColumn('sucursal_id');
            }
            if (Schema::hasColumn('reparacion_checklist_items', 'seccion')) {
                $table->dropColumn('seccion');
            }
            if (Schema::hasColumn('reparacion_checklist_items', 'descripcion')) {
                $table->dropColumn('descripcion');
            }
            if (Schema::hasColumn('reparacion_checklist_items', 'icono')) {
                $table->dropColumn('icono');
            }
            if (Schema::hasColumn('reparacion_checklist_items', 'is_default')) {
                $table->dropColumn('is_default');
            }
            if (! Schema::hasColumn('reparacion_checklist_items', 'categoria')) {
                $table->string('categoria')->default('general')->after('nombre');
            }
        });
    }
};
