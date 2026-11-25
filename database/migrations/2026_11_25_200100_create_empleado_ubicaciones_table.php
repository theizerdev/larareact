<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ubicación del colaborador cada 15 minutos durante su jornada, enviada por
 * la app (de la entrada a la salida; fuera de jornada no se guarda).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empleado_ubicaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            // Marcaje que abrió la jornada en la que se tomó el punto.
            $table->foreignId('asistencia_marcaje_id')->nullable()->constrained('asistencia_marcajes')->nullOnDelete();
            $table->decimal('latitud', 10, 7);
            $table->decimal('longitud', 10, 7);
            $table->decimal('precision_metros', 10, 2)->nullable();
            $table->boolean('ubicacion_simulada')->default(false);
            // Hora en que el teléfono tomó el punto (zona de la app).
            $table->dateTime('fecha_hora');
            // La app reintenta los envíos: el uuid evita duplicados.
            $table->string('uuid_cliente', 36)->unique();
            $table->timestamps();

            $table->index(['empleado_id', 'fecha_hora']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empleado_ubicaciones');
    }
};
