<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vincula cada marcaje de asistencia con la checada del reloj BioTime de
     * la que salió.
     *
     * Es lo que hace idempotente el puente reloj → asistencia → nómina: la
     * importación hace upsert por esta columna, así que reprocesar un día no
     * duplica checadas, y si alguien cambia a qué empleado pertenece un
     * código de BioTime, el marcaje se mueve en vez de quedarse huérfano.
     *
     * Sin llave foránea a propósito: en SQLite agregarla a una tabla existente
     * obliga a reconstruirla, y la tabla espejo nunca borra filas.
     */
    public function up(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->unsignedBigInteger('biotime_marcaje_id')->nullable()->after('dispositivo_id');
            $table->unique('biotime_marcaje_id');
        });
    }

    public function down(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->dropUnique(['biotime_marcaje_id']);
            $table->dropColumn('biotime_marcaje_id');
        });
    }
};
