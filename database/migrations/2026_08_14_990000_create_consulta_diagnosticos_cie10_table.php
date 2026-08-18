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
        Schema::create('consulta_diagnosticos_cie10', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consulta_id')->constrained('consultas_medicas')->onDelete('cascade');
            $table->string('codigo', 20);
            $table->string('nombre');
            $table->enum('tipo', ['principal', 'secundario', 'presuntivo'])->default('principal');
            $table->text('observaciones')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consulta_diagnosticos_cie10');
    }
};
