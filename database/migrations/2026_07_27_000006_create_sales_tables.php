<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('set null');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->foreignId('cash_register_id')->nullable()->constrained('cash_registers')->onDelete('set null');
            $table->foreignId('user_id')->constrained('users');
            $table->string('codigo_ticket')->unique();
            $table->string('cliente_nombre')->default('Cliente General');
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('impuesto', 15, 2)->default(0.00);
            $table->decimal('descuento', 15, 2)->default(0.00);
            $table->decimal('total', 15, 2);
            $table->decimal('monto_recibido', 15, 2)->default(0.00);
            $table->decimal('cambio', 15, 2)->default(0.00);
            $table->enum('estado', ['completada', 'anulada'])->default('completada');
            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->nullableMorphs('itemable');
            $table->string('concepto_tipo'); // 'producto' o 'servicio'
            $table->string('nombre');
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 15, 2);
            $table->decimal('subtotal', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
