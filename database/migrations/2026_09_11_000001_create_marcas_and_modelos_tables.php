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
        Schema::create('marcas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre')->unique();
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('modelo_equipos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marca_id')->constrained('marcas')->onDelete('cascade');
            $table->string('nombre');
            $table->string('almacenamiento')->nullable(); // Ej: 128GB, 256GB
            $table->string('ram')->nullable(); // Ej: 6GB, 8GB
            $table->string('procesador')->nullable();
            $table->string('pantalla')->nullable();
            $table->string('bateria')->nullable();
            $table->string('imagen')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['marca_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('modelo_equipos');
        Schema::dropIfExists('marcas');
    }
};

