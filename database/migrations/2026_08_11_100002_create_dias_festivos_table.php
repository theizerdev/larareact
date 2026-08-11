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
        Schema::create('dias_festivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->date('fecha');
            $table->string('descripcion');
            $table->boolean('es_oficial_lft')->default(true); // Art. 74 LFT
            $table->decimal('pago_porcentaje', 5, 2)->default(200.00); // 200% adicional (pago triple)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dias_festivos');
    }
};
