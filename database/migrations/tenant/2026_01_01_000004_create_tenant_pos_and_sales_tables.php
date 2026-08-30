<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('cash_registers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->decimal('opening_amount', 15, 2)->default(0.00);
            $table->decimal('closing_amount', 15, 2)->nullable();
            $table->decimal('counted_amount', 15, 2)->nullable();
            $table->decimal('expected_amount', 15, 2)->nullable();
            $table->decimal('difference', 15, 2)->nullable();
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamps();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_register_id')->constrained('cash_registers')->cascadeOnDelete();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->enum('type', ['inflow', 'outflow']);
            $table->string('concepto')->default('otro');
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->unsignedBigInteger('created_by')->index();
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('cliente_id')->nullable()->index();
            $table->string('codigo_ticket')->index();
            $table->string('cliente_nombre')->default('Cliente General');
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('impuesto', 15, 2)->default(0.00);
            $table->decimal('descuento', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2);
            $table->decimal('monto_recibido', 15, 2)->default(0.00);
            $table->decimal('cambio', 15, 2)->default(0.00);
            $table->enum('estado', ['completada', 'anulada'])->default('completada');
            $table->boolean('es_credito')->default(false);
            $table->decimal('saldo_credito', 15, 2)->default(0.00);
            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->nullableMorphs('itemable');
            $table->string('concepto_tipo');
            $table->string('nombre');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });

        Schema::create('sale_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('metodo_pago');
            $table->decimal('monto', 15, 2);
            $table->string('referencia')->nullable();
            $table->timestamps();
        });

        Schema::create('held_sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('codigo')->index();
            $table->string('cliente_nombre')->nullable();
            $table->json('items');
            $table->decimal('total', 15, 2)->default(0.00);
            $table->timestamps();
        });

        Schema::create('sales_goals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->integer('year');
            $table->integer('month');
            $table->decimal('base_sales', 12, 2)->default(0.00);
            $table->decimal('increment_percentage', 5, 2)->default(0.00);
            $table->decimal('target_amount', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('producto_id')->constrained('productos')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->enum('tipo', ['entrada', 'salida', 'ajuste']);
            $table->decimal('cantidad', 12, 3);
            $table->decimal('stock_anterior', 12, 3);
            $table->decimal('stock_nuevo', 12, 3);
            $table->string('motivo');
            $table->string('referencia')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('sales_goals');
        Schema::dropIfExists('held_sales');
        Schema::dropIfExists('sale_payments');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_registers');
    }
};
