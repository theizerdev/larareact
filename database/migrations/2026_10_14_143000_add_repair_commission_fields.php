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
        // 1. Agregar campos de comisión de reparación a la tabla empleados
        if (Schema::hasTable('empleados')) {
            Schema::table('empleados', function (Blueprint $table) {
                if (!Schema::hasColumn('empleados', 'porcentaje_comision_reparacion')) {
                    $table->decimal('porcentaje_comision_reparacion', 5, 2)->default(0.00)->after('porcentaje_comision');
                }
                if (!Schema::hasColumn('empleados', 'tipo_comision_reparacion')) {
                    $table->enum('tipo_comision_reparacion', ['porcentaje', 'monto_fijo'])->default('porcentaje')->after('porcentaje_comision_reparacion');
                }
                if (!Schema::hasColumn('empleados', 'comision_reparacion_aplica_a')) {
                    $table->enum('comision_reparacion_aplica_a', ['mano_obra', 'total_orden'])->default('mano_obra')->after('tipo_comision_reparacion');
                }
            });
        }

        // 2. Agregar campos de comisión y enlace de pago a la tabla ordenes_reparacion
        if (Schema::hasTable('ordenes_reparacion')) {
            Schema::table('ordenes_reparacion', function (Blueprint $table) {
                if (!Schema::hasColumn('ordenes_reparacion', 'empleado_id')) {
                    $table->foreignId('empleado_id')->nullable()->after('tecnico_id')->constrained('empleados')->onDelete('set null');
                }
                if (!Schema::hasColumn('ordenes_reparacion', 'comision_monto')) {
                    $table->decimal('comision_monto', 12, 2)->default(0.00)->after('comision_tecnico_pct');
                }
                if (!Schema::hasColumn('ordenes_reparacion', 'comision_estado')) {
                    $table->enum('comision_estado', ['pendiente', 'pagada', 'no_aplica'])->default('pendiente')->after('comision_monto')->index();
                }
                if (!Schema::hasColumn('ordenes_reparacion', 'comision_pago_id')) {
                    $table->foreignId('comision_pago_id')->nullable()->after('comision_estado')->constrained('comision_pagos')->onDelete('set null');
                }
            });
        }

        // 3. Agregar métricas de reparaciones a comision_pagos
        if (Schema::hasTable('comision_pagos')) {
            Schema::table('comision_pagos', function (Blueprint $table) {
                if (!Schema::hasColumn('comision_pagos', 'total_reparaciones_base')) {
                    $table->decimal('total_reparaciones_base', 14, 2)->default(0.00)->after('total_ventas_base');
                }
                if (!Schema::hasColumn('comision_pagos', 'cantidad_reparaciones')) {
                    $table->unsignedInteger('cantidad_reparaciones')->default(0)->after('cantidad_ventas');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('comision_pagos')) {
            Schema::table('comision_pagos', function (Blueprint $table) {
                $table->dropColumn(['total_reparaciones_base', 'cantidad_reparaciones']);
            });
        }

        if (Schema::hasTable('ordenes_reparacion')) {
            Schema::table('ordenes_reparacion', function (Blueprint $table) {
                if (Schema::hasColumn('ordenes_reparacion', 'comision_pago_id')) {
                    $table->dropForeign(['comision_pago_id']);
                }
                if (Schema::hasColumn('ordenes_reparacion', 'empleado_id')) {
                    $table->dropForeign(['empleado_id']);
                }
                $table->dropColumn(['empleado_id', 'comision_monto', 'comision_estado', 'comision_pago_id']);
            });
        }

        if (Schema::hasTable('empleados')) {
            Schema::table('empleados', function (Blueprint $table) {
                $table->dropColumn(['porcentaje_comision_reparacion', 'tipo_comision_reparacion', 'comision_reparacion_aplica_a']);
            });
        }
    }
};
