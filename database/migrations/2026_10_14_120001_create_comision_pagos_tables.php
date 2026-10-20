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
        if (!Schema::hasTable('comision_pagos')) {
            Schema::create('comision_pagos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
                $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
                $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null'); // Quien registra el pago (admin/cajero)
                $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers')->onDelete('set null');

                $table->string('codigo_recibo', 50)->index(); // Ej: REC-COM-000001
                $table->decimal('monto_total', 14, 2)->default(0.00);
                $table->decimal('total_ventas_base', 14, 2)->default(0.00);
                $table->unsignedInteger('cantidad_ventas')->default(0);
                $table->string('metodo_pago', 50)->default('efectivo'); // efectivo, transferencia, etc.
                $table->dateTime('fecha_pago')->index();
                $table->date('periodo_desde')->nullable();
                $table->date('periodo_hasta')->nullable();
                $table->text('notas')->nullable();

                $table->timestamps();

                $table->index(['empresa_id', 'empleado_id', 'fecha_pago']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comision_pagos');
    }
};
