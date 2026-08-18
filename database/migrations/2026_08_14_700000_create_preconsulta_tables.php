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
        // 1. Tabla de Plantillas de Cuestionario por Especialidad / Tipo de Atención
        Schema::create('plantillas_preconsulta', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('especialidad_id')->nullable()->constrained('especialidades')->onDelete('set null');
            $table->foreignId('tipo_atencion_id')->nullable()->constrained('tipos_atencion')->onDelete('set null');
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->json('preguntas'); // Array de preguntas estructuradas
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Tabla de Enlaces / Respuestas de Pre-Consulta para Citas
        Schema::create('cita_preconsultas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cita_id')->constrained('citas')->onDelete('cascade');
            $table->foreignId('plantilla_id')->nullable()->constrained('plantillas_preconsulta')->onDelete('set null');
            $table->string('token', 64)->unique();
            $table->json('respuestas')->nullable(); // Respuestas llenadas por el paciente
            $table->boolean('completado')->default(false);
            $table->timestamp('completado_at')->nullable();
            $table->string('ip_origen', 45)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cita_preconsultas');
        Schema::dropIfExists('plantillas_preconsulta');
    }
};
