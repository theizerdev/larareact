<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('sucursales', 'codigo_numeral')) {
            Schema::table('sucursales', function (Blueprint $table) {
                $table->string('codigo_numeral', 2)->default('01')->after('nombre');
            });
        }

        // Asignar codigos numerales por defecto a sucursales existentes si sus nombres coinciden
        try {
            DB::table('sucursales')->where('nombre', 'like', '%Purépero%')->orWhere('nombre', 'like', '%Purepero%')->update(['codigo_numeral' => '01']);
            DB::table('sucursales')->where('nombre', 'like', '%Tuxcueca%')->update(['codigo_numeral' => '02']);
        } catch (\Exception $e) {
            // Log or ignore if table empty
        }

        if (!Schema::hasColumn('empleados', 'codigo_acceso')) {
            Schema::table('empleados', function (Blueprint $table) {
                $table->string('codigo_acceso', 20)->nullable()->unique()->after('documento_identidad');
            });
        }

        if (!Schema::hasColumn('proveedores', 'codigo_acceso')) {
            Schema::table('proveedores', function (Blueprint $table) {
                $table->string('codigo_acceso', 20)->nullable()->unique()->after('documento_identidad');
            });
        }

        if (!Schema::hasColumn('productores', 'codigo_acceso')) {
            Schema::table('productores', function (Blueprint $table) {
                $table->string('codigo_acceso', 20)->nullable()->unique()->after('documento_identidad');
            });
        }

        try {
            Schema::table('visitas_accesos', function (Blueprint $table) {
                $table->dropUnique('visitas_accesos_codigo_visitante_unique');
            });
        } catch (\Exception $e) {
            // Index might not exist or already dropped
        }

        try {
            Schema::table('visitas_accesos', function (Blueprint $table) {
                $table->index('codigo_visitante', 'visitas_accesos_codigo_visitante_index');
            });
        } catch (\Exception $e) {
            // Index already exists
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('sucursales', 'codigo_numeral')) {
            Schema::table('sucursales', function (Blueprint $table) {
                $table->dropColumn('codigo_numeral');
            });
        }

        if (Schema::hasColumn('empleados', 'codigo_acceso')) {
            Schema::table('empleados', function (Blueprint $table) {
                $table->dropColumn('codigo_acceso');
            });
        }

        if (Schema::hasColumn('proveedores', 'codigo_acceso')) {
            Schema::table('proveedores', function (Blueprint $table) {
                $table->dropColumn('codigo_acceso');
            });
        }

        if (Schema::hasColumn('productores', 'codigo_acceso')) {
            Schema::table('productores', function (Blueprint $table) {
                $table->dropColumn('codigo_acceso');
            });
        }
    }
};
