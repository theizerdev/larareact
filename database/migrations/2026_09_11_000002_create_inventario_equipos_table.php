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
        Schema::create('inventario_equipos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
            $table->foreignId('modelo_equipo_id')->constrained('modelo_equipos')->onDelete('cascade');
            
            // Identificadores únicos del equipo móvil
            $table->string('imei_1', 20)->unique();
            $table->string('imei_2', 20)->nullable();
            $table->string('serial', 50)->nullable();

            $table->string('color')->nullable();
            $table->enum('condicion', ['nuevo', 'usado', 'reacondicionado'])->default('nuevo');

            // Precios y costos
            $table->decimal('costo_compra', 12, 2)->default(0);
            $table->decimal('precio_contado', 12, 2)->default(0);
            $table->decimal('precio_financiado', 12, 2)->default(0);

            // Estado del ciclo de vida del equipo
            $table->enum('estado', [
                'disponible',
                'reservado',
                'vendido_credito',
                'vendido_contado',
                'bloqueado',
                'garantia'
            ])->default('disponible');

            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['empresa_id', 'sucursal_id', 'estado']);
            $table->index('imei_1');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventario_equipos');
    }
};

