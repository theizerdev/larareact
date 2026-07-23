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
            // Permitir 'visitante' en tipo_acceso ENUM
            DB::statement("ALTER TABLE visitas_accesos MODIFY COLUMN tipo_acceso ENUM('empleado', 'proveedor', 'productor', 'visitante') NOT NULL DEFAULT 'empleado'");

            if (!Schema::hasColumn('visitas_accesos', 'invitacion_id')) {
                $table->foreignId('invitacion_id')->nullable()->after('productor_vehiculo_id')->constrained('visita_acceso_invitaciones')->onDelete('set null');
            }
            if (!Schema::hasColumn('visitas_accesos', 'visitante_nombre')) {
                $table->string('visitante_nombre')->nullable()->after('invitacion_id');
            }
            if (!Schema::hasColumn('visitas_accesos', 'visitante_documento')) {
                $table->string('visitante_documento')->nullable()->after('visitante_nombre');
            }
            if (!Schema::hasColumn('visitas_accesos', 'foto_carnet')) {
                $table->text('foto_carnet')->nullable()->after('visitante_documento');
            }
            if (!Schema::hasColumn('visitas_accesos', 'doc_foto_frontal')) {
                $table->text('doc_foto_frontal')->nullable()->after('foto_carnet');
            }
            if (!Schema::hasColumn('visitas_accesos', 'doc_foto_trasera')) {
                $table->text('doc_foto_trasera')->nullable()->after('doc_foto_frontal');
            }
            if (!Schema::hasColumn('visitas_accesos', 'visitante_empresa')) {
                $table->string('visitante_empresa')->nullable()->after('doc_foto_trasera');
            }
            if (!Schema::hasColumn('visitas_accesos', 'visitante_telefono')) {
                $table->string('visitante_telefono')->nullable()->after('visitante_empresa');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas_accesos', function (Blueprint $table) {
            if (Schema::hasColumn('visitas_accesos', 'invitacion_id')) {
                $table->dropForeign(['invitacion_id']);
                $table->dropColumn([
                    'invitacion_id',
                    'visitante_nombre',
                    'visitante_documento',
                    'foto_carnet',
                    'doc_foto_frontal',
                    'doc_foto_trasera',
                    'visitante_empresa',
                    'visitante_telefono',
                ]);
            }
            DB::statement("ALTER TABLE visitas_accesos MODIFY COLUMN tipo_acceso ENUM('empleado', 'proveedor', 'productor') NOT NULL DEFAULT 'empleado'");
        });
    }
};
