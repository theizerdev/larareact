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
        Schema::create('productor_empleados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('productor_id')->constrained('productores')->cascadeOnDelete();
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('documento_identidad');
            $table->string('genero')->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->integer('edad')->nullable();
            $table->string('correo')->nullable();
            $table->string('cargo')->nullable();
            $table->string('foto_carnet')->nullable();
            $table->string('documento_frontal')->nullable();
            $table->string('documento_reverso')->nullable();
            
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
        Schema::dropIfExists('productor_empleados');
    }
};
