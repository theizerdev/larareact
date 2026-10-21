<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // La API de BioTime no recibe fotos: viajan en el ZIP de bio-photos.
        // Se guarda qué foto (ruta de empleados.foto_empleado) salió en el
        // último ZIP para que el siguiente traiga sólo las nuevas o cambiadas.
        Schema::table('biotime_empleados', function (Blueprint $table) {
            $table->string('foto_exportada')->nullable();
            $table->timestamp('foto_exportada_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('biotime_empleados', fn (Blueprint $t) => $t->dropColumn(['foto_exportada', 'foto_exportada_at']));
    }
};
