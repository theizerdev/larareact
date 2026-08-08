<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ordenes_reparacion', function (Blueprint $table) {
            $table->decimal('comision_tecnico_pct', 5, 2)->default(0)->after('tecnico_id');
        });

        Schema::table('nominas', function (Blueprint $table) {
            $table->decimal('total_comision_reparaciones', 14, 2)->default(0)->after('total_descuentos');
        });

        Schema::table('nomina_detalles', function (Blueprint $table) {
            $table->decimal('comision_reparaciones', 14, 2)->default(0)->after('descuentos');
            $table->decimal('monto_pagado_reparaciones_periodo', 14, 2)->default(0)->after('comision_reparaciones');
            $table->unsignedInteger('reparaciones_reparadas_periodo')->default(0)->after('monto_pagado_reparaciones_periodo');
        });
    }

    public function down(): void
    {
        Schema::table('nomina_detalles', function (Blueprint $table) {
            $table->dropColumn([
                'comision_reparaciones',
                'monto_pagado_reparaciones_periodo',
                'reparaciones_reparadas_periodo',
            ]);
        });

        Schema::table('nominas', function (Blueprint $table) {
            $table->dropColumn('total_comision_reparaciones');
        });

        Schema::table('ordenes_reparacion', function (Blueprint $table) {
            $table->dropColumn('comision_tecnico_pct');
        });
    }
};
