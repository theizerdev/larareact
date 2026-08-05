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
        Schema::create('testimonios', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_cliente');
            $table->string('empresa_cargo')->nullable();
            $table->string('ubicacion')->nullable();
            $table->string('avatar')->nullable();
            $table->text('comentario');
            $table->unsignedTinyInteger('calificacion')->default(5);
            $table->string('metrica_destacada')->nullable();
            $table->boolean('destacado')->default(true);
            $table->boolean('activo')->default(true);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('testimonios');
    }
};
