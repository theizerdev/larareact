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
        Schema::create('reloj_equipos_biometricos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('reloj_ubicacion_id')->nullable()->constrained('reloj_ubicaciones')->nullOnDelete();
            $table->string('legacy', 60)->nullable()->index();
            $table->string('localidad_nombre');
            $table->integer('numero_localidad')->nullable()->index();
            $table->string('ubicacion_fisica')->nullable();

            // Bloque 1: Equipos actuales (Cols E-J)
            $table->string('actual_no_serie', 120)->nullable();
            $table->string('actual_ip', 60)->nullable();
            $table->string('actual_mascara', 60)->nullable();
            $table->string('actual_gateway', 60)->nullable();
            $table->boolean('actual_instalado')->default(false);
            $table->text('actual_comentario')->nullable();

            // Bloque 2: Nuevos biométricos (Cols K-Q)
            $table->string('nuevo_no_serie', 120)->nullable();
            $table->string('nuevo_ip', 60)->nullable();
            $table->string('nuevo_mascara', 60)->nullable();
            $table->string('nuevo_gateway', 60)->nullable();
            $table->boolean('nuevo_instalado')->default(false);
            $table->text('nuevo_comentario')->nullable();
            $table->string('nuevo_mac_address', 60)->nullable();

            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'numero_localidad']);
            $table->index(['empresa_id', 'localidad_nombre']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reloj_equipos_biometricos');
    }
};

