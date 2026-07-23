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
        Schema::create('productor_vehiculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('productor_id')->constrained('productores')->cascadeOnDelete();
            $table->string('tipo_vehiculo');
            $table->string('marca');
            $table->string('modelo');
            $table->integer('year');
            $table->string('placa');
            $table->string('foto_frontal')->nullable();
            $table->string('foto_trasera')->nullable();
            
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
        Schema::dropIfExists('productor_vehiculos');
    }
};
