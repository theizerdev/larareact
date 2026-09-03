<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('compras')) {
            Schema::table('compras', function (Blueprint $table) {
                if (!Schema::hasColumn('compras', 'usar_fondo_mes')) {
                    $table->boolean('usar_fondo_mes')->default(false)->after('cierre_mensual_id');
                }
            });
        }

        if (Schema::hasTable('cierres_mensuales')) {
            Schema::table('cierres_mensuales', function (Blueprint $table) {
                if (!Schema::hasColumn('cierres_mensuales', 'total_ingresos')) {
                    $table->decimal('total_ingresos', 14, 2)->default(0)->after('fecha_cierre');
                }
                if (!Schema::hasColumn('cierres_mensuales', 'total_egresos')) {
                    $table->decimal('total_egresos', 14, 2)->default(0)->after('total_ingresos');
                }
                if (!Schema::hasColumn('cierres_mensuales', 'saldo_neto')) {
                    $table->decimal('saldo_neto', 14, 2)->default(0)->after('total_egresos');
                }
                if (!Schema::hasColumn('cierres_mensuales', 'fondo_siguiente_mes')) {
                    $table->decimal('fondo_siguiente_mes', 14, 2)->default(0)->after('saldo_neto');
                }
                if (!Schema::hasColumn('cierres_mensuales', 'retiro_utilidad')) {
                    $table->decimal('retiro_utilidad', 14, 2)->default(0)->after('fondo_siguiente_mes');
                }
                if (!Schema::hasColumn('cierres_mensuales', 'status')) {
                    $table->enum('status', ['abierto', 'cerrado'])->default('cerrado')->after('retiro_utilidad');
                }

                // Drop legacy columns if present
                if (Schema::hasColumn('cierres_mensuales', 'total_ventas')) {
                    $table->dropColumn('total_ventas');
                }
                if (Schema::hasColumn('cierres_mensuales', 'total_compras')) {
                    $table->dropColumn('total_compras');
                }
                if (Schema::hasColumn('cierres_mensuales', 'total_gastos')) {
                    $table->dropColumn('total_gastos');
                }
                if (Schema::hasColumn('cierres_mensuales', 'utilidad_neta')) {
                    $table->dropColumn('utilidad_neta');
                }
                if (Schema::hasColumn('cierres_mensuales', 'estado')) {
                    $table->dropColumn('estado');
                }
            });
        }
    }

    public function down(): void
    {
        // Safe down
    }
};
