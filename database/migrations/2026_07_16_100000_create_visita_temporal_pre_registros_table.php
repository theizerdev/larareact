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
        Schema::create('visita_temporal_pre_registros', function (Blueprint $table) {
            $table->id();
            $table->string('nombres');
            $table->string('apellidos');
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->onDelete('set null');
            $table->string('telefono');
            $table->text('motivo_registro')->nullable();
            $table->foreignId('responsable_id')->nullable()->constrained('responsables')->onDelete('set null');
            $table->foreignId('departamento_id')->nullable()->constrained('departamentos')->onDelete('set null');
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->onDelete('set null');
            $table->foreignId('cargo_id')->nullable()->constrained('cargos')->onDelete('set null');
            $table->string('token')->unique();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('cascade');
            $table->string('status')->default('pendiente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visita_temporal_pre_registros');
    }
};
