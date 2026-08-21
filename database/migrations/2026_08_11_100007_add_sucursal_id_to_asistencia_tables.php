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
        if (Schema::hasTable('configuraciones_asistencia') && !Schema::hasColumn('configuraciones_asistencia', 'sucursal_id')) {
            Schema::table('configuraciones_asistencia', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            });
        }

        if (Schema::hasTable('turnos_laborales') && !Schema::hasColumn('turnos_laborales', 'sucursal_id')) {
            Schema::table('turnos_laborales', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            });
        }

        if (Schema::hasTable('dias_festivos') && !Schema::hasColumn('dias_festivos', 'sucursal_id')) {
            Schema::table('dias_festivos', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            });
        }

        if (Schema::hasTable('asistencia_resumenes_diarios') && !Schema::hasColumn('asistencia_resumenes_diarios', 'sucursal_id')) {
            Schema::table('asistencia_resumenes_diarios', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            });
        }

        if (Schema::hasTable('asistencia_resumenes_semanales') && !Schema::hasColumn('asistencia_resumenes_semanales', 'sucursal_id')) {
            Schema::table('asistencia_resumenes_semanales', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('turnos_laborales', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('dias_festivos', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('asistencia_resumenes_diarios', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });

        Schema::table('asistencia_resumenes_semanales', function (Blueprint $table) {
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn('sucursal_id');
        });
    }
};
