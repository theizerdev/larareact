<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Apagado por defecto: escribir en BioTime Cloud cambia el padrón que
        // reciben los relojes. Cada empresa lo prende cuando ya eligió el área.
        Schema::table('empresas', function (Blueprint $table) {
            $table->boolean('biotime_push')->default(false);
            // biotime_id del área de BioTime con la que se da de alta a los
            // colaboradores nuevos: decide a qué relojes llegan.
            $table->unsignedBigInteger('biotime_push_area_id')->nullable();
        });

        // Resultado del último envío, para ver desde Colaboradores quién no llegó al reloj y por qué.
        Schema::table('empleados', function (Blueprint $table) {
            $table->timestamp('biotime_pushed_at')->nullable();
            $table->text('biotime_push_error')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('empresas', fn (Blueprint $t) => $t->dropColumn(['biotime_push', 'biotime_push_area_id']));
        Schema::table('empleados', fn (Blueprint $t) => $t->dropColumn(['biotime_pushed_at', 'biotime_push_error']));
    }
};
