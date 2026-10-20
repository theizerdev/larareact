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
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'empleado_id')) {
                $table->foreignId('empleado_id')->nullable()->after('user_id')->constrained('empleados')->onDelete('set null');
            }
            if (!Schema::hasColumn('sales', 'comision_porcentaje')) {
                $table->decimal('comision_porcentaje', 5, 2)->default(0.00)->after('notas');
            }
            if (!Schema::hasColumn('sales', 'comision_monto')) {
                $table->decimal('comision_monto', 12, 2)->default(0.00)->after('comision_porcentaje');
            }
            if (!Schema::hasColumn('sales', 'comision_estado')) {
                $table->enum('comision_estado', ['no_aplica', 'pendiente', 'pagada'])->default('no_aplica')->after('comision_monto')->index();
            }
            if (!Schema::hasColumn('sales', 'comision_pago_id')) {
                $table->foreignId('comision_pago_id')->nullable()->after('comision_estado')->constrained('comision_pagos')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            if (Schema::hasColumn('sales', 'comision_pago_id')) {
                $table->dropForeign(['comision_pago_id']);
                $table->dropColumn('comision_pago_id');
            }
            if (Schema::hasColumn('sales', 'empleado_id')) {
                $table->dropForeign(['empleado_id']);
                $table->dropColumn('empleado_id');
            }
            $dropCols = [];
            foreach (['comision_porcentaje', 'comision_monto', 'comision_estado'] as $col) {
                if (Schema::hasColumn('sales', $col)) {
                    $dropCols[] = $col;
                }
            }
            if (!empty($dropCols)) {
                $table->dropColumn($dropCols);
            }
        });
    }
};
