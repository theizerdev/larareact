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
        // 1. Tabla de Consultas Médicas Atendidas
        Schema::create('consultas_medicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('cita_id')->constrained('citas')->onDelete('cascade');
            $table->foreignId('paciente_id')->constrained('pacientes')->onDelete('cascade');
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->foreignId('especialidad_id')->nullable()->constrained('especialidades')->onDelete('set null');

            // Anamnesis (SOAP)
            $table->text('motivo_consulta')->nullable();
            $table->text('enfermedad_actual')->nullable();
            $table->text('examen_fisico')->nullable();

            // Signos Vitales
            $table->string('presion_arterial', 20)->nullable();
            $table->integer('frecuencia_cardiaca')->nullable();
            $table->decimal('temperatura', 4, 1)->nullable();
            $table->decimal('peso_kg', 5, 2)->nullable();
            $table->decimal('talla_cm', 5, 2)->nullable();
            $table->decimal('imc', 4, 2)->nullable();
            $table->integer('spo2')->nullable();

            // Diagnóstico
            $table->string('diagnostico_cie10_codigo', 20)->nullable();
            $table->string('diagnostico_cie10_nombre')->nullable();
            $table->text('observaciones_diagnostico')->nullable();
            $table->text('plan_tratamiento')->nullable();

            $table->enum('estado', ['sala_de_espera', 'en_consultorio', 'finalizada'])->default('sala_de_espera');

            $table->timestamp('finalizada_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // 2. Tabla de Recetas Médicas
        Schema::create('recetas_medicas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consulta_id')->constrained('consultas_medicas')->onDelete('cascade');
            $table->foreignId('paciente_id')->constrained('pacientes')->onDelete('cascade');
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->string('codigo_receta', 50)->unique();
            $table->text('indicaciones_generales')->nullable();
            $table->integer('vigencia_dias')->default(30);
            $table->timestamps();
        });

        // 3. Tabla de Detalle de Medicamentos Prescritos
        Schema::create('receta_medicamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('receta_id')->constrained('recetas_medicas')->onDelete('cascade');
            $table->string('medicamento_nombre');
            $table->string('dosis');
            $table->string('via_administracion')->default('Oral');
            $table->string('frecuencia'); // ej: Cada 8 horas
            $table->integer('duracion_dias')->default(7);
            $table->text('instrucciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('receta_medicamentos');
        Schema::dropIfExists('recetas_medicas');
        Schema::dropIfExists('consultas_medicas');
    }
};
