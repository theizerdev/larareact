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
        Schema::create('configuraciones_asistencia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->integer('tolerancia_retardo_minutos')->default(10);
            $table->integer('tolerancia_falta_minutos')->default(30);
            $table->boolean('descanso_es_tiempo_efectivo')->default(false); // Art. 64 LFT
            $table->boolean('horas_extra_requieren_aprobacion')->default(true);
            $table->decimal('porcentaje_prima_dominical', 5, 2)->default(25.00); // Art. 71 LFT
            $table->boolean('requiere_foto_marcaje')->default(false);
            $table->integer('redondeo_marcaje_minutos')->default(0); // 0, 5, 10, 15
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuraciones_asistencia');
    }
};
