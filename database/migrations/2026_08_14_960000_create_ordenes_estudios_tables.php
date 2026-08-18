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
        // 1. Tabla Principal de Órdenes de Estudios Solicitados
        Schema::create('ordenes_estudios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consulta_id')->constrained('consultas_medicas')->onDelete('cascade');
            $table->foreignId('paciente_id')->constrained('pacientes')->onDelete('cascade');
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->text('indicaciones_generales')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        // 2. Tabla de Detalle de Estudios (Items)
        Schema::create('orden_estudio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('orden_estudio_id')->constrained('ordenes_estudios')->onDelete('cascade');
            $table->string('tipo_estudio')->default('Laboratorio'); // Laboratorio, Imagenología, Electrofisiología, Otro
            $table->string('nombre_estudio');
            $table->text('indicaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orden_estudio_items');
        Schema::dropIfExists('ordenes_estudios');
    }
};
