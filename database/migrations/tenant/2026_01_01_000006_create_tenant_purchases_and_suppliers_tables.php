<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('razon_social');
            $table->string('nombre_contacto')->nullable();
            $table->string('documento')->nullable();
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::create('cierres_mensuales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->smallInteger('year');
            $table->tinyInteger('month');
            $table->decimal('total_ventas', 14, 2)->default(0.00);
            $table->decimal('total_compras', 14, 2)->default(0.00);
            $table->decimal('total_gastos', 14, 2)->default(0.00);
            $table->decimal('utilidad_neta', 14, 2)->default(0.00);
            $table->enum('estado', ['abierto', 'cerrado'])->default('abierto');
            $table->timestamp('fecha_cierre')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'sucursal_id', 'year', 'month'], 'cierre_mensual_unique_period');
        });

        Schema::create('compras', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('proveedor_id')->constrained('proveedores')->restrictOnDelete();
            $table->foreignId('cierre_mensual_id')->nullable()->constrained('cierres_mensuales')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            
            $table->string('codigo_compra', 50)->nullable()->index();
            $table->string('numero_factura', 100)->nullable();
            $table->string('numero_control', 100)->nullable();
            $table->enum('tipo_pago', ['contado', 'credito'])->default('contado');
            $table->date('fecha_emision')->useCurrent();
            $table->date('fecha_vencimiento')->nullable();
            $table->enum('status', ['completada', 'anulada'])->default('completada');

            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('impuesto', 14, 2)->default(0);
            $table->decimal('descuento', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);

            $table->decimal('monto_pagado', 14, 2)->default(0);
            $table->decimal('saldo_pendiente', 14, 2)->default(0);

            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('compra_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->cascadeOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->decimal('cantidad', 12, 3);
            $table->decimal('costo_unitario', 14, 2);
            $table->decimal('subtotal', 14, 2);
            $table->timestamps();
        });

        Schema::create('compra_pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('compra_id')->constrained('compras')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('monto', 14, 2);
            $table->date('fecha_pago')->useCurrent();
            $table->string('referencia')->nullable();
            $table->text('nota')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compra_pagos');
        Schema::dropIfExists('compra_items');
        Schema::dropIfExists('compras');
        Schema::dropIfExists('cierres_mensuales');
        Schema::dropIfExists('proveedores');
    }
};
