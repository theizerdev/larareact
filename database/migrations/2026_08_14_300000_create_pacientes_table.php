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
        Schema::create('pacientes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');

            // Código correlativo por clínica (ej. PAC-2026-0001)
            $table->string('codigo_paciente');
            $table->enum('tipo_paciente', ['humano', 'animal'])->default('humano');

            // 1. Datos Paciente Humano
            $table->string('nombres')->nullable();
            $table->string('apellidos')->nullable();
            $table->string('documento_identidad')->nullable();
            $table->date('fecha_nacimiento')->nullable();
            $table->enum('genero', ['masculino', 'femenino', 'otro'])->nullable();
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->onDelete('set null');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();
            $table->text('direccion')->nullable();
            $table->string('contacto_emergencia_nombre')->nullable();
            $table->string('contacto_emergencia_telefono')->nullable();

            // Datos Médicos Universales / Antecedentes
            $table->string('tipo_sangre')->nullable();
            $table->text('alergias')->nullable();
            $table->text('antecedentes_medicos')->nullable();
            $table->string('foto')->nullable();

            // 2. Datos Ficha Veterinaria / Paciente Animal
            $table->string('nombre_mascota')->nullable();
            $table->string('especie')->nullable(); // Canino, Felino, Equino, Ave, Exótico, etc.
            $table->string('raza')->nullable();
            $table->string('color_marcas')->nullable();
            $table->string('microchip')->nullable();
            $table->boolean('esterilizado')->default(false);
            $table->string('tutor_nombre')->nullable();
            $table->string('tutor_documento')->nullable();
            $table->foreignId('pais_telefono_tutor_id')->nullable()->constrained('pais')->onDelete('set null');
            $table->string('tutor_telefono')->nullable();
            $table->string('tutor_email')->nullable();

            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['empresa_id', 'codigo_paciente']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pacientes');
    }
};
