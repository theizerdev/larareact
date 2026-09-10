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
        Schema::create('creditos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_credito', 30)->unique();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->foreignId('inventario_equipo_id')->constrained('inventario_equipos')->onDelete('cascade');
            $table->foreignId('plan_financiamiento_id')->constrained('planes_financiamiento')->onDelete('cascade');
            $table->foreignId('user_id')->comment('Vendedor que originó el crédito')->constrained('users')->onDelete('cascade');

            $table->date('fecha_inicio');

            // Valores de la venta y financiamiento
            $table->decimal('precio_equipo', 12, 2);
            $table->decimal('monto_inicial', 12, 2);
            $table->string('metodo_pago_inicial')->default('efectivo');
            $table->string('referencia_pago_inicial')->nullable();

            $table->decimal('monto_financiado', 12, 2); // precio_equipo - monto_inicial
            $table->decimal('porcentaje_interes', 5, 2)->default(0);
            $table->decimal('interes_total', 12, 2)->default(0);
            $table->decimal('total_credito', 12, 2); // monto_financiado + interes_total
            $table->decimal('saldo_pendiente', 12, 2);

            $table->enum('estado', [
                'pendiente_aprobacion',
                'aprobado',
                'activo',
                'liquidado',
                'en_mora',
                'cancelado',
                'incobrable'
            ])->default('activo');

            $table->string('contrato_url')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'sucursal_id', 'estado']);
            $table->index('codigo_credito');
        });

        Schema::create('cuotas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('credito_id')->constrained('creditos')->onDelete('cascade');
            $table->unsignedSmallInteger('numero_cuota'); // 1, 2, 3...
            $table->date('fecha_vencimiento');

            $table->decimal('monto_capital', 12, 2);
            $table->decimal('monto_interes', 12, 2)->default(0);
            $table->decimal('monto_cuota', 12, 2); // capital + interes
            $table->decimal('monto_mora', 12, 2)->default(0);
            $table->decimal('monto_pagado', 12, 2)->default(0);
            $table->decimal('saldo_cuota', 12, 2);

            $table->date('fecha_pago')->nullable();
            $table->string('metodo_pago')->nullable();
            $table->string('referencia_pago')->nullable();

            $table->enum('estado', [
                'pendiente',
                'parcial',
                'pagada',
                'vencida'
            ])->default('pendiente');

            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['credito_id', 'numero_cuota']);
            $table->index(['fecha_vencimiento', 'estado']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cuotas');
        Schema::dropIfExists('creditos');
    }
};

