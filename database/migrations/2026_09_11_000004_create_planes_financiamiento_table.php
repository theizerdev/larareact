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
        Schema::create('planes_financiamiento', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->string('nombre');
            $table->text('descripcion')->nullable();

            // Periodicidad y cuotas
            $table->enum('frecuencia', ['semanal', 'quincenal', 'mensual'])->default('quincenal');
            $table->unsignedInteger('numero_cuotas')->default(4);

            // Porcentajes financieros
            $table->decimal('porcentaje_inicial_minimo', 5, 2)->default(30.00); // 30% inicial
            $table->decimal('porcentaje_interes_total', 5, 2)->default(15.00);   // 15% recargo financiamiento
            
            // Reglas de mora
            $table->unsignedSmallInteger('dias_gracia')->default(2);
            $table->decimal('mora_diaria_porcentaje', 5, 2)->default(0.50); // 0.5% por día de atraso

            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('planes_financiamiento');
    }
};

