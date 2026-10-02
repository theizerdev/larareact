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
        Schema::create('empleados', function (Blueprint $table) {
            $table->id();

            // Datos personales
            $table->string('nombres');
            $table->string('apellidos');
            $table->string('documento_identidad')->unique();

            // Teléfono
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->nullOnDelete();
            $table->string('telefono')->nullable();

            // Correo y Género
            $table->string('correo')->nullable();
            $table->string('genero')->nullable();

            // Relaciones laborales
            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->nullOnDelete();
            $table->foreignId('responsable_id')->nullable()->constrained('responsables')->nullOnDelete();
            $table->foreignId('cargo_id')->nullable()->constrained('cargos')->nullOnDelete();

            // Fotos
            $table->string('foto_empleado')->nullable();
            $table->string('foto_documento')->nullable();

            // Metadatos
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empleados');
    }
};
