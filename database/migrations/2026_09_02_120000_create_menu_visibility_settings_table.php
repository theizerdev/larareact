<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Visibilidad global del menú lateral, controlada solo por el superadmin.
     * Guarda únicamente las excepciones: si no hay fila para una clave, ese
     * módulo/submódulo se considera visible. Ocultar aquí es puramente visual
     * (quita el ítem del sidebar); no afecta permisos ni el acceso por URL.
     */
    public function up(): void
    {
        Schema::create('menu_visibility_settings', function (Blueprint $table) {
            $table->id();
            $table->string('menu_key')->unique();
            $table->boolean('visible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_visibility_settings');
    }
};
