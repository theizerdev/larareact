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
        Schema::create('turnos_laborales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->string('nombre');
            $table->string('tipo_jornada')->default('diurna'); // diurna, nocturna, mixta, personalizada
            $table->time('hora_entrada');
            $table->time('hora_salida');
            $table->decimal('horas_diarias_ley', 4, 2)->default(8.00); // 8.00 (diurna), 7.00 (nocturna), 7.50 (mixta)
            $table->integer('minutos_descanso')->default(30); // Art. 63 LFT
            $table->boolean('descanso_pagado')->default(false); // Art. 64 LFT
            $table->json('dias_laborables')->nullable(); // [1, 2, 3, 4, 5]
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('turnos_laborales');
    }
};
