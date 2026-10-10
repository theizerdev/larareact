<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Apagado por defecto: cada empresa decide si el padrón del reloj
        // alimenta a Colaboradores. Prenderlo en una empresa que no es dueña del
        // reloj mezclaría empleados ajenos.
        Schema::table('empresas', function (Blueprint $table) {
            $table->boolean('biotime_auto_alta')->default(false);
        });

        Schema::table('empleados', function (Blueprint $table) {
            $table->date('fecha_ingreso')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('empresas', fn (Blueprint $t) => $t->dropColumn('biotime_auto_alta'));
        Schema::table('empleados', fn (Blueprint $t) => $t->dropColumn('fecha_ingreso'));
    }
};
