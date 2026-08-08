<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nominas', function (Blueprint $table) {
            if (Schema::hasColumn('nominas', 'total_comisiones')) {
                $table->dropColumn('total_comisiones');
            }
        });

        Schema::table('nomina_detalles', function (Blueprint $table) {
            $dropColumns = [];

            if (Schema::hasColumn('nomina_detalles', 'comision_ventas')) {
                $dropColumns[] = 'comision_ventas';
            }
            if (Schema::hasColumn('nomina_detalles', 'comision_reparaciones')) {
                $dropColumns[] = 'comision_reparaciones';
            }
            if (Schema::hasColumn('nomina_detalles', 'ventas_total_mes')) {
                $dropColumns[] = 'ventas_total_mes';
            }
            if (Schema::hasColumn('nomina_detalles', 'reparaciones_pagadas_mes')) {
                $dropColumns[] = 'reparaciones_pagadas_mes';
            }

            if (! empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }

    public function down(): void
    {
        Schema::table('nominas', function (Blueprint $table) {
            if (! Schema::hasColumn('nominas', 'total_comisiones')) {
                $table->decimal('total_comisiones', 14, 2)->default(0)->after('total_descuentos');
            }
        });

        Schema::table('nomina_detalles', function (Blueprint $table) {
            if (! Schema::hasColumn('nomina_detalles', 'comision_ventas')) {
                $table->decimal('comision_ventas', 14, 2)->default(0)->after('descuentos');
            }
            if (! Schema::hasColumn('nomina_detalles', 'comision_reparaciones')) {
                $table->decimal('comision_reparaciones', 14, 2)->default(0)->after('comision_ventas');
            }
            if (! Schema::hasColumn('nomina_detalles', 'ventas_total_mes')) {
                $table->decimal('ventas_total_mes', 14, 2)->default(0)->after('comision_reparaciones');
            }
            if (! Schema::hasColumn('nomina_detalles', 'reparaciones_pagadas_mes')) {
                $table->unsignedInteger('reparaciones_pagadas_mes')->default(0)->after('ventas_total_mes');
            }
        });
    }
};
