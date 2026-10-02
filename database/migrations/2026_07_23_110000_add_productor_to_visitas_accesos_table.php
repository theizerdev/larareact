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

        // Corregir registros existentes donde se guardó proveedor_vehiculo_id erróneamente en tipo_acceso productor
        try {
            $accesosProductorErrados = DB::table('visitas_accesos')
                ->where('tipo_acceso', 'productor')
                ->get();

            foreach ($accesosProductorErrados as $acc) {
                $prodVehId = $acc->productor_vehiculo_id ?? $acc->proveedor_vehiculo_id;
                $pv = null;
                if ($prodVehId) {
                    $pv = DB::table('productor_vehiculos')->where('id', $prodVehId)->first();
                }
                if (!$pv && $acc->productor_id) {
                    $pv = DB::table('productor_vehiculos')->where('productor_id', $acc->productor_id)->first();
                }

                if ($pv) {
                    DB::table('visitas_accesos')->where('id', $acc->id)->update([
                        'productor_vehiculo_id' => $pv->id,
                        'proveedor_vehiculo_id' => null,
                        'vehiculo_marca'        => $pv->marca,
                        'vehiculo_modelo'       => $pv->modelo,
                        'vehiculo_placa'        => $pv->placa,
                        'vehiculo_tipo'         => $pv->tipo_vehiculo ?? 'Auto',
                        'vehiculo_foto_frontal' => $pv->foto_frontal,
                        'vehiculo_foto_trasera' => $pv->foto_trasera,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Ignorar en entornos de pruebas
        }
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
