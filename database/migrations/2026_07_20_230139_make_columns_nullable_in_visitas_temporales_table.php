<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitas_temporales', function (Blueprint $table) {
            $table->string('documento_identidad')->nullable()->change();
            $table->date('fecha_ingreso')->nullable()->change();
            $table->time('hora_ingreso')->nullable()->change();
            $table->date('fecha_salida')->nullable()->change();
            $table->time('hora_salida')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas_temporales', function (Blueprint $table) {
            $table->string('documento_identidad')->nullable(false)->change();
            $table->date('fecha_ingreso')->nullable(false)->change();
            $table->time('hora_ingreso')->nullable(false)->change();
            $table->date('fecha_salida')->nullable(false)->change();
            $table->time('hora_salida')->nullable(false)->change();
        });
    }
};
