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
            if (!Schema::hasColumn('configuraciones_asistencia', 'reforma_laboral_ano')) {
                // Régimen y límites de jornada semanal gradual (Reforma 48h -> 40h)
                $table->unsignedSmallInteger('reforma_laboral_ano')->default(2026)->after('redondeo_marcaje_minutos');
                $table->decimal('limite_horas_normales_semanal', 5, 2)->default(48.00)->after('reforma_laboral_ano');
                $table->decimal('limite_tex_doble_semanal', 5, 2)->default(12.00)->after('limite_horas_normales_semanal');
                $table->decimal('limite_tex_triple_semanal', 5, 2)->default(4.00)->after('limite_tex_doble_semanal');

                // Umbrales Semáforo Normal (Horas acumuladas en la semana)
                $table->decimal('semaforo_normal_verde', 5, 2)->default(42.00)->after('limite_tex_triple_semanal');
                $table->decimal('semaforo_normal_amarillo', 5, 2)->default(44.00)->after('semaforo_normal_verde');
                $table->decimal('semaforo_normal_rojo', 5, 2)->default(46.00)->after('semaforo_normal_amarillo');

                // Umbrales Semáforo TEX Doble
                $table->decimal('semaforo_tex_doble_verde', 5, 2)->default(7.00)->after('semaforo_normal_rojo');
                $table->decimal('semaforo_tex_doble_amarillo', 5, 2)->default(8.00)->after('semaforo_tex_doble_verde');
                $table->decimal('semaforo_tex_doble_rojo', 5, 2)->default(9.00)->after('semaforo_tex_doble_amarillo');

                // Umbrales Semáforo TEX Triple
                $table->decimal('semaforo_tex_triple_verde', 5, 2)->default(2.00)->after('semaforo_tex_doble_rojo');
                $table->decimal('semaforo_tex_triple_amarillo', 5, 2)->default(3.00)->after('semaforo_tex_triple_verde');
                $table->decimal('semaforo_tex_triple_rojo', 5, 2)->default(4.00)->after('semaforo_tex_triple_amarillo');

                // Notificaciones escalonadas
                $table->string('notif_rh_email')->nullable()->after('semaforo_tex_triple_rojo');
                $table->boolean('notif_rh_enabled')->default(true)->after('notif_rh_email');
                $table->boolean('notif_responsable_enabled')->default(true)->after('notif_rh_enabled');
                $table->string('notif_dg_email')->nullable()->after('notif_responsable_enabled');
                $table->boolean('notif_dg_enabled')->default(true)->after('notif_dg_email');
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
                'reforma_laboral_ano',
                'limite_horas_normales_semanal',
                'limite_tex_doble_semanal',
                'limite_tex_triple_semanal',
                'semaforo_normal_verde',
                'semaforo_normal_amarillo',
                'semaforo_normal_rojo',
                'semaforo_tex_doble_verde',
                'semaforo_tex_doble_amarillo',
                'semaforo_tex_doble_rojo',
                'semaforo_tex_triple_verde',
                'semaforo_tex_triple_amarillo',
                'semaforo_tex_triple_rojo',
                'notif_rh_email',
                'notif_rh_enabled',
                'notif_responsable_enabled',
                'notif_dg_email',
                'notif_dg_enabled',
            ]);
        });
    }
};
