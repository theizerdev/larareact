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
        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            if (!Schema::hasColumn('configuraciones_asistencia', 'ley_silla_intervalo_horas')) {
                $table->decimal('ley_silla_intervalo_horas', 4, 2)->default(2.00)->after('tolerancia_retardo_minutos');
                $table->integer('ley_silla_descanso_minutos')->default(5)->after('ley_silla_intervalo_horas');
                $table->json('opciones_descanso_minutos')->nullable()->after('ley_silla_descanso_minutos');
                $table->boolean('whatsapp_recordatorio_descanso')->default(true)->after('opciones_descanso_minutos');
                $table->decimal('whatsapp_recordatorio_horas_post_entrada', 4, 2)->default(4.00)->after('whatsapp_recordatorio_descanso');
            }
        });

        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            if (!Schema::hasColumn('asistencia_marcajes', 'incidente_causa')) {
                $table->string('incidente_causa')->nullable()->after('origen');
                $table->integer('duracion_descanso_minutos')->nullable()->after('incidente_causa');
                $table->string('geolocalizacion')->nullable()->after('duracion_descanso_minutos');
                $table->string('tipo_entrada')->default('normal')->after('geolocalizacion');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->dropColumn([
                'ley_silla_intervalo_horas',
                'ley_silla_descanso_minutos',
                'opciones_descanso_minutos',
                'whatsapp_recordatorio_descanso',
                'whatsapp_recordatorio_horas_post_entrada',
            ]);
        });

        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->dropColumn([
                'incidente_causa',
                'duracion_descanso_minutos',
                'geolocalizacion',
                'tipo_entrada',
            ]);
        });
    }
};
