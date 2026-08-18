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
        Schema::create('consulta_reposos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consulta_id')->constrained('consultas_medicas')->onDelete('cascade');
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('paciente_id')->nullable()->constrained('pacientes')->onDelete('cascade');
            $table->foreignId('medico_id')->nullable()->constrained('medicos')->onDelete('cascade');

            $table->boolean('tiene_reposo')->default(true);
            $table->string('tipo_reposo')->default('relativo'); // relativo, absoluto, laboral, deportivo, domiciliario
            $table->integer('dias_reposo')->default(1);
            $table->date('fecha_inicio')->nullable();
            $table->date('fecha_fin')->nullable();
            $table->text('motivo_reposo')->nullable();
            $table->text('observaciones')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consulta_reposos');
    }
};
