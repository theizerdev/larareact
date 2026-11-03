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
        // 1. Catálogo maestro de actividades de la Cédula de Instalación
        Schema::create('reloj_cedula_actividades_catalogo', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('etapa_num'); // 1, 2, 3
            $table->string('etapa_nombre', 150);
            $table->string('sub_etapa_letra', 5); // A, B, C...
            $table->string('sub_etapa_nombre', 255);
            $table->unsignedInteger('orden')->default(0);
            $table->unsignedInteger('numero_actividad'); // 1, 2, 3...
            $table->text('descripcion');
            $table->string('tipo', 50)->default('Nuevo'); // Inicial / Nuevo
            $table->string('responsable_default', 120)->nullable();
            $table->string('valida_default', 120)->nullable();
            $table->string('fecha_compromiso_default', 60)->nullable();
            $table->string('entregable_evidencia', 255)->nullable();
            $table->text('observaciones_default')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['etapa_num', 'sub_etapa_letra', 'numero_actividad'], 'idx_cedula_cat_etapa_sub');
        });

        // 2. Instancia de la Cédula para cada equipo biométrico (1 a 1)
        Schema::create('reloj_biometrico_cedulas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reloj_equipo_biometrico_id')
                ->unique()
                ->constrained('reloj_equipos_biometricos')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('etapa_actual_num')->default(1);
            $table->string('sub_etapa_actual_letra', 5)->default('A');
            $table->decimal('porcentaje_avance', 5, 2)->default(0.00);
            $table->unsignedInteger('total_actividades')->default(48);
            $table->unsignedInteger('actividades_completadas')->default(0);
            $table->string('estado', 30)->default('pendiente'); // pendiente, en_proceso, completada
            $table->dateTime('fecha_inicio')->nullable();
            $table->dateTime('fecha_completada')->nullable();
            $table->text('notas_generales')->nullable();
            $table->timestamps();

            $table->index('estado');
        });

        // 3. Detalle de actividades de la Cédula por biométrico
        Schema::create('reloj_biometrico_cedula_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reloj_biometrico_cedula_id')
                ->constrained('reloj_biometrico_cedulas')
                ->cascadeOnDelete();
            $table->foreignId('catalogo_actividad_id')
                ->constrained('reloj_cedula_actividades_catalogo')
                ->cascadeOnDelete();
            $table->unsignedTinyInteger('etapa_num');
            $table->string('sub_etapa_letra', 5);
            $table->unsignedInteger('numero_actividad');
            $table->string('estado', 30)->default('pendiente'); // pendiente, en_proceso, completada, no_aplica
            $table->string('responsable', 120)->nullable();
            $table->string('valida', 120)->nullable();
            $table->string('fecha_compromiso', 60)->nullable();
            $table->string('fecha_realizada', 60)->nullable();
            $table->string('evidencia_path', 255)->nullable();
            $table->string('evidencia_tipo', 50)->nullable(); // foto, documento, url, texto
            $table->text('observaciones')->nullable();
            $table->foreignId('validado_por_usuario_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->dateTime('validado_at')->nullable();
            $table->timestamps();

            $table->unique(['reloj_biometrico_cedula_id', 'catalogo_actividad_id'], 'uniq_cedula_item');
            $table->index(['etapa_num', 'sub_etapa_letra']);
            $table->index('estado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reloj_biometrico_cedula_items');
        Schema::dropIfExists('reloj_biometrico_cedulas');
        Schema::dropIfExists('reloj_cedula_actividades_catalogo');
    }
};

