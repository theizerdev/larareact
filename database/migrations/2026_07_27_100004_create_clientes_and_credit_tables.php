<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('clientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('set null');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->string('nombre');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->string('direccion')->nullable();
            $table->decimal('limite_credito', 15, 2)->default(0.00);
            $table->decimal('saldo_pendiente', 15, 2)->default(0.00);
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('credit_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('cliente_id')->constrained('clientes')->onDelete('cascade');
            $table->string('metodo_pago')->default('efectivo');
            $table->decimal('monto', 15, 2);
            $table->text('nota')->nullable();
            $table->foreignId('received_by')->constrained('users');
            $table->timestamps();
        });

        // Add credit columns to sales
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('cliente_id')->nullable()->after('user_id')->constrained('clientes')->onDelete('set null');
            $table->boolean('es_credito')->default(false)->after('estado');
            $table->decimal('saldo_credito', 15, 2)->default(0.00)->after('es_credito');
        });
    }

    public function down(): void {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['cliente_id']);
            $table->dropColumn(['cliente_id', 'es_credito', 'saldo_credito']);
        });
        Schema::dropIfExists('credit_payments');
        Schema::dropIfExists('clientes');
    }
};
