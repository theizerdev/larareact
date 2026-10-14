<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tipos de comida con costo para el INICIO COMIDA del kiosko: la empresa
 * configura las opciones y cada marcaje guarda la elegida con el costo que
 * tenía en ese momento (si luego cambia el precio, el histórico no se mueve).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->json('opciones_comida')->nullable()->after('opciones_descanso_minutos');
        });

        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->string('comida_tipo', 60)->nullable()->after('duracion_descanso_minutos');
            $table->decimal('comida_costo', 10, 2)->nullable()->after('comida_tipo');
        });
    }

    public function down(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->dropColumn(['comida_tipo', 'comida_costo']);
        });

        Schema::table('configuraciones_asistencia', function (Blueprint $table) {
            $table->dropColumn('opciones_comida');
        });
    }
};
