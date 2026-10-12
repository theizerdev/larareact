<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // BioTime local identifica al empleado con un entero, pero BioTime
        // Cloud usa un UUID ("99f206c2-be94-11f1-991f-0a58a9feac02"). Con la
        // columna numérica MySQL truncaba el valor y el sync de empleados
        // fallaba. Una cadena admite ambos formatos.
        Schema::table('biotime_empleados', function (Blueprint $table) {
            $table->string('biotime_id', 64)->change();
        });
    }

    public function down(): void
    {
        // Solo revierte limpio si no hay empleados sincronizados desde Cloud.
        Schema::table('biotime_empleados', function (Blueprint $table) {
            $table->unsignedBigInteger('biotime_id')->change();
        });
    }
};
