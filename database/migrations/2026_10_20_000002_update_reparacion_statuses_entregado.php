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
        if (Schema::hasTable('ordenes_reparacion')) {
            // Actualizar 'entregado_finalizado' a 'entregado_reparado'
            DB::table('ordenes_reparacion')
                ->where('estado_orden', 'entregado_finalizado')
                ->update(['estado_orden' => 'entregado_reparado']);

            if (Schema::hasTable('orden_reparacion_historials')) {
                DB::table('orden_reparacion_historials')
                    ->where('estado_nuevo', 'entregado_finalizado')
                    ->update(['estado_nuevo' => 'entregado_reparado']);
                DB::table('orden_reparacion_historials')
                    ->where('estado_anterior', 'entregado_finalizado')
                    ->update(['estado_anterior' => 'entregado_reparado']);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('ordenes_reparacion')) {
            DB::table('ordenes_reparacion')
                ->where('estado_orden', 'entregado_reparado')
                ->update(['estado_orden' => 'entregado_finalizado']);

            if (Schema::hasTable('orden_reparacion_historials')) {
                DB::table('orden_reparacion_historials')
                    ->where('estado_nuevo', 'entregado_reparado')
                    ->update(['estado_nuevo' => 'entregado_finalizado']);
                DB::table('orden_reparacion_historials')
                    ->where('estado_anterior', 'entregado_reparado')
                    ->update(['estado_anterior' => 'entregado_finalizado']);
            }
        }
    }
};
