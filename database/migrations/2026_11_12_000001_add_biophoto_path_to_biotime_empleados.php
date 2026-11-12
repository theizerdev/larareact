<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Copia local de la bio-foto (rostro para los relojes) que BioTime
        // guarda aparte de la foto de perfil (photo_path).
        Schema::table('biotime_empleados', function (Blueprint $table) {
            $table->string('biophoto_path')->nullable()->after('photo_path');
        });
    }

    public function down(): void
    {
        Schema::table('biotime_empleados', fn (Blueprint $t) => $t->dropColumn('biophoto_path'));
    }
};
