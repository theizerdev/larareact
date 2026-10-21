<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            // Viaja a BioTime como birthday.
            $table->date('fecha_nacimiento')->nullable()->after('genero');
            // Cuándo terminó el enrolamiento (aviso de privacidad aceptado, fotos y datos capturados).
            $table->timestamp('enrolado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('empleados', fn (Blueprint $t) => $t->dropColumn(['fecha_nacimiento', 'enrolado_en']));
    }
};
