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
        Schema::create('asistencia_resumenes_semanales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
            $table->date('periodo_inicio');
            $table->date('periodo_fin');
            $table->decimal('total_horas_ordinarias', 6, 2)->default(0.00);
            $table->decimal('total_horas_extra_dobles', 6, 2)->default(0.00); // Primeras 9h (Art. 67 LFT)
            $table->decimal('total_horas_extra_triples', 6, 2)->default(0.00); // Exceso > 9h (Art. 68 LFT)
            $table->integer('dias_festivos_trabajados')->default(0);
            $table->integer('primas_dominicales_aplicadas')->default(0);
            $table->decimal('monto_horas_ordinarias', 10, 2)->default(0.00);
            $table->decimal('monto_horas_dobles', 10, 2)->default(0.00);
            $table->decimal('monto_horas_triples', 10, 2)->default(0.00);
            $table->decimal('monto_primas_dominicales', 10, 2)->default(0.00);
            $table->decimal('monto_festivos', 10, 2)->default(0.00);
            $table->decimal('monto_total_pagar', 10, 2)->default(0.00);
            $table->string('estado')->default('abierto'); // abierto, cerrado, exportado
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asistencia_resumenes_semanales');
    }
};
