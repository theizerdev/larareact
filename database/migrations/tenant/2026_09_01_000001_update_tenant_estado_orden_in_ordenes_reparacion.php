<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ordenes_reparacion', function (Blueprint $table) {
            $table->string('estado_orden', 60)->default('recibido')->change();
        });

        // Homologar datos existentes del tenant
        DB::table('ordenes_reparacion')->where('estado_orden', 'en_diagnostico')->update(['estado_orden' => 'en_diagnostico_presupuesto']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'presupuestado')->update(['estado_orden' => 'confirmacion_presupuesto']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'esperando_repuesto')->update(['estado_orden' => 'espera_refaccion']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'reparado')->update(['estado_orden' => 'listo_reparado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'cancelado')->update(['estado_orden' => 'listo_sin_solucion']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'entregado')->update(['estado_orden' => 'entregado_finalizado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'reincidencia')->update(['estado_orden' => 'reincidencia_garantia']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('ordenes_reparacion')->where('estado_orden', 'en_diagnostico_presupuesto')->update(['estado_orden' => 'en_diagnostico']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'confirmacion_presupuesto')->update(['estado_orden' => 'presupuestado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'espera_refaccion')->update(['estado_orden' => 'esperando_repuesto']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'listo_reparado')->update(['estado_orden' => 'reparado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'listo_sin_solucion')->update(['estado_orden' => 'cancelado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'entregado_finalizado')->update(['estado_orden' => 'entregado']);
        DB::table('ordenes_reparacion')->where('estado_orden', 'reincidencia_garantia')->update(['estado_orden' => 'reincidencia']);
    }
};
