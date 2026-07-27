<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('held_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('set null');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->foreignId('user_id')->constrained('users');
            $table->string('label')->nullable();
            $table->json('cart_data');
            $table->string('cliente_nombre')->default('Cliente General');
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('held_sales');
    }
};
