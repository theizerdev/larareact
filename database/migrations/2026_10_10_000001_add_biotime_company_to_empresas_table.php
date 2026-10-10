<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // BioTime Cloud autentica con compañía + correo + contraseña (los
        // mismos tres campos de su login web). Vacío = BioTime local, que
        // sólo pide usuario + contraseña.
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('biotime_company', 150)->nullable()->after('biotime_base_url');
        });
    }

    public function down(): void
    {
        Schema::table('empresas', fn (Blueprint $t) => $t->dropColumn('biotime_company'));
    }
};
