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
        Schema::create('asistencia_resumenes_diarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
            $table->foreignId('turno_laboral_id')->nullable()->constrained('turnos_laborales')->nullOnDelete();
            $table->date('fecha');
            $table->time('hora_entrada_real')->nullable();
            $table->time('hora_salida_real')->nullable();
            $table->integer('minutos_retraso')->default(0);
            $table->integer('minutos_descanso_reales')->default(0);
            $table->decimal('horas_ordinarias', 5, 2)->default(0.00);
            $table->decimal('horas_extra_diarias', 5, 2)->default(0.00);
            $table->boolean('es_festivo')->default(false);
            $table->boolean('aplica_prima_dominical')->default(false);
            $table->boolean('es_dia_descanso')->default(false);
            $table->string('estado')->default('aprobado'); // pendiente, aprobado, corregido
            $table->decimal('monto_estimado_dia', 10, 2)->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asistencia_resumenes_diarios');
    }
};
