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
        Schema::create('medicos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');

            // Usuario opcional para permitir login al portal
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            // Código correlativo del profesional (ej. MED-2026-0001)
            $table->string('codigo_medico');

            // Datos Personales y Profesionales
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('documento_identidad')->nullable();

            // Identificación Profesional Adaptativa (Cédula Profesional, ReTHUS, Colegiado, NPI, MPPS, etc.)
            $table->string('licencia_medica')->nullable();
            $table->string('tipo_licencia')->nullable(); // Ej: "Cédula Profesional", "ReTHUS", "MPPS", etc.

            // Teléfono e Internacionalización
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->onDelete('set null');
            $table->string('telefono')->nullable();
            $table->string('email')->nullable();

            // Especialidad Principal (Relación a especialidades)
            $table->foreignId('especialidad_principal_id')->nullable()->constrained('especialidades')->onDelete('set null');

            // Preferencias Visuales de Agenda & Perfil
            $table->string('color_agenda')->default('#3b82f6'); // Azul predeterminado para calendario
            $table->text('biografia')->nullable();
            $table->string('foto')->nullable();

            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['empresa_id', 'codigo_medico']);
        });

        // Tabla Pivote para Especialidades Secundarias Múltiples
        Schema::create('medico_especialidad', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->foreignId('especialidad_id')->constrained('especialidades')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['medico_id', 'especialidad_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medico_especialidad');
        Schema::dropIfExists('medicos');
    }
};
