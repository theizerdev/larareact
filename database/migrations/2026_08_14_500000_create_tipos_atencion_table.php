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
        Schema::create('tipos_atencion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->string('nombre', 150);
            $table->string('slug', 150)->nullable();
            $table->string('codigo', 50)->nullable();
            $table->string('modalidad', 50)->default('presencial'); // presencial, telemedicina, domicilio, urgencia, procedimiento
            $table->string('tipo_consulta', 50)->default('general'); // primera_vez, subsecuente, control, general, procedimiento
            $table->boolean('es_primera_vez')->default(false);
            $table->boolean('es_subsecuente')->default(false);
            $table->text('descripcion')->nullable();
            $table->string('icono', 50)->default('Stethoscope');
            $table->string('color', 10)->default('#3b82f6');
            $table->unsignedInteger('duracion_estimada_minutos')->default(30);
            $table->boolean('requiere_link_virtual')->default(false);
            $table->boolean('requiere_direccion')->default(false);
            $table->decimal('costo_adicional_sugerido', 10, 2)->nullable();
            $table->boolean('permite_reserva_online')->default(true);
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['empresa_id', 'status']);
            $table->index(['empresa_id', 'modalidad']);
            $table->index(['empresa_id', 'tipo_consulta']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_atencion');
    }
};
