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
        Schema::create('proveedores', function (Blueprint $table) {
            $table->id();
            $table->string('razon_social');
            $table->string('nombre_comercial');
            $table->string('documento_identidad')->unique();
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->nullOnDelete();
            $table->string('telefono')->nullable();
            $table->text('direccion')->nullable();
            $table->string('responsable')->nullable();
            $table->foreignId('pais_id')->nullable()->constrained('pais')->nullOnDelete();
            $table->decimal('latitud', 10, 8)->nullable();
            $table->decimal('longitud', 11, 8)->nullable();
            $table->string('status')->default('activo'); // activo, suspendido, en_revision
            
            // Metadatos multi-inquilino
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proveedores');
    }
};
