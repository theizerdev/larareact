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
        Schema::create('productor_pre_registros', function (Blueprint $table) {
            $table->id();
            $table->string('razon_social_rancho')->nullable();
            $table->string('nombre_comercial_rancho')->nullable();
            $table->foreignId('pais_telefono_id')->constrained('pais');
            $table->string('telefono');
            $table->string('token')->unique();
            $table->dateTime('expires_at');
            $table->string('status')->default('pendiente'); // pendiente, completado, expirado
            
            // Metadatos multi-inquilino
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productor_pre_registros');
    }
};
