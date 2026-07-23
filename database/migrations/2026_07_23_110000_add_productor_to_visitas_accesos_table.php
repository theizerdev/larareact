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
        Schema::table('visitas_accesos', function (Blueprint $table) {
            // Modificar la columna tipo_acceso para permitir 'productor'
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE visitas_accesos MODIFY COLUMN tipo_acceso ENUM('empleado', 'proveedor', 'productor') NOT NULL DEFAULT 'empleado'");
            }

            // Agregar claves foráneas para Productor
            if (!Schema::hasColumn('visitas_accesos', 'productor_id')) {
                $table->foreignId('productor_id')->nullable()->after('proveedor_empleado_id')->constrained('productores')->onDelete('cascade');
            }
            if (!Schema::hasColumn('visitas_accesos', 'productor_empleado_id')) {
                $table->foreignId('productor_empleado_id')->nullable()->after('productor_id')->constrained('productor_empleados')->onDelete('set null');
            }
            if (!Schema::hasColumn('visitas_accesos', 'productor_vehiculo_id')) {
                $table->foreignId('productor_vehiculo_id')->nullable()->after('proveedor_vehiculo_id')->constrained('productor_vehiculos')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas_accesos', function (Blueprint $table) {
            if (Schema::hasColumn('visitas_accesos', 'productor_vehiculo_id')) {
                $table->dropForeign(['productor_vehiculo_id']);
                $table->dropColumn('productor_vehiculo_id');
            }
            if (Schema::hasColumn('visitas_accesos', 'productor_empleado_id')) {
                $table->dropForeign(['productor_empleado_id']);
                $table->dropColumn('productor_empleado_id');
            }
            if (Schema::hasColumn('visitas_accesos', 'productor_id')) {
                $table->dropForeign(['productor_id']);
                $table->dropColumn('productor_id');
            }

            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE visitas_accesos MODIFY COLUMN tipo_acceso ENUM('empleado', 'proveedor') NOT NULL DEFAULT 'empleado'");
            }
        });
    }
};
