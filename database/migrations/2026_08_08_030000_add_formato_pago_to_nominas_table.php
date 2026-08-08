<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominas', function (Blueprint $table) {
            $table->enum('formato_pago', ['diaria', 'semanal', 'quincenal', 'mensual'])
                ->default('mensual')
                ->after('month');
            $table->date('periodo_inicio')->nullable()->after('formato_pago');
            $table->date('periodo_fin')->nullable()->after('periodo_inicio');
            $table->index(['empresa_id', 'sucursal_id', 'formato_pago', 'periodo_inicio', 'periodo_fin'], 'nominas_scope_formato_periodo_idx');
        });

        DB::table('nominas')
            ->whereNull('periodo_inicio')
            ->whereNull('periodo_fin')
            ->update([
                'periodo_inicio' => DB::raw("STR_TO_DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-01'), '%Y-%m-%d')"),
                'periodo_fin' => DB::raw("LAST_DAY(STR_TO_DATE(CONCAT(year, '-', LPAD(month, 2, '0'), '-01'), '%Y-%m-%d'))"),
            ]);
    }

    public function down(): void
    {
        Schema::table('nominas', function (Blueprint $table) {
            $table->dropIndex('nominas_scope_formato_periodo_idx');
            $table->dropColumn(['formato_pago', 'periodo_inicio', 'periodo_fin']);
        });
    }
};
