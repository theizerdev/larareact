<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominas', function (Blueprint $table) {
            $table->decimal('total_comisiones', 14, 2)->default(0)->after('total_descuentos');
        });

        Schema::table('nomina_detalles', function (Blueprint $table) {
            $table->decimal('comision_ventas', 14, 2)->default(0)->after('descuentos');
            $table->decimal('comision_reparaciones', 14, 2)->default(0)->after('comision_ventas');
            $table->decimal('ventas_total_mes', 14, 2)->default(0)->after('comision_reparaciones');
            $table->unsignedInteger('reparaciones_pagadas_mes')->default(0)->after('ventas_total_mes');
        });
    }

    public function down(): void
    {
        Schema::table('nomina_detalles', function (Blueprint $table) {
            $table->dropColumn([
                'comision_ventas',
                'comision_reparaciones',
                'ventas_total_mes',
                'reparaciones_pagadas_mes',
            ]);
        });

        Schema::table('nominas', function (Blueprint $table) {
            $table->dropColumn('total_comisiones');
        });
    }
};
