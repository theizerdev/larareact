<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Evidencia que manda la app móvil con cada marcaje: identificador para no
 * duplicar reenvíos, hora real de captura cuando llega tarde desde la cola
 * sin conexión, y calidad de la ubicación (precisión, GPS simulado, motivo
 * cuando no hubo ubicación).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->string('uuid_cliente', 36)->nullable()->unique()->after('dispositivo_id');
            $table->dateTime('fecha_hora_dispositivo')->nullable()->after('fecha_hora');
            $table->boolean('enviado_desde_cola')->default(false)->after('fecha_hora_dispositivo');
            $table->decimal('precision_metros', 8, 1)->nullable()->after('longitud');
            $table->boolean('ubicacion_simulada')->nullable()->after('precision_metros');
            $table->string('ubicacion_estado', 30)->nullable()->after('ubicacion_simulada');
            $table->dateTime('ubicacion_fecha_hora')->nullable()->after('ubicacion_estado');
        });

        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->boolean('requiere_ubicacion_marcaje')->default(false)->after('requiere_foto_marcaje');
        });
    }

    public function down(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->dropUnique(['uuid_cliente']);
            $table->dropColumn([
                'uuid_cliente',
                'fecha_hora_dispositivo',
                'enviado_desde_cola',
                'precision_metros',
                'ubicacion_simulada',
                'ubicacion_estado',
                'ubicacion_fecha_hora',
            ]);
        });

        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->dropColumn('requiere_ubicacion_marcaje');
        });
    }
};
