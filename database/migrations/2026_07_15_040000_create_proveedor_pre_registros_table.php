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
        Schema::create('proveedor_pre_registros', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_comercial');
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->nullOnDelete();
            $table->string('telefono');
            $table->string('token')->unique();
            $table->timestamp('expires_at');
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->string('status')->default('pendiente'); // pendiente, completado, expirado
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedor_pre_registros');
    }
};
