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
        Schema::create('ramas_medicas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->string('icono')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::create('especialidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rama_medica_id')->constrained('ramas_medicas')->onDelete('cascade');
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->string('codigo')->nullable();
            $table->string('icono')->nullable();
            $table->string('color')->nullable();
            $table->text('descripcion')->nullable();
            $table->decimal('costo_consulta_sugerido', 10, 2)->default(30.00);
            $table->integer('duracion_consulta_minutos')->default(30);
            $table->boolean('status')->default(true);
            $table->timestamps();
        });

        Schema::create('empresa_especialidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('especialidad_id')->constrained('especialidades')->onDelete('cascade');
            $table->boolean('es_principal')->default(false);
            $table->boolean('status')->default(true);
            $table->timestamps();

            $table->unique(['empresa_id', 'especialidad_id']);
        });

        Schema::create('plantillas_consultas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('especialidad_id')->constrained('especialidades')->onDelete('cascade');
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->json('estructura_json');
            $table->boolean('es_sistema')->default(true);
            $table->boolean('status')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plantillas_consultas');
        Schema::dropIfExists('empresa_especialidades');
        Schema::dropIfExists('especialidades');
        Schema::dropIfExists('ramas_medicas');
    }
};
