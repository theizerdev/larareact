<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visita_acceso_invitaciones', function (Blueprint $table) {
            $table->text('foto_carnet')->nullable()->after('visitante_documento');
        });
    }

    public function down(): void
    {
        Schema::table('visita_acceso_invitaciones', function (Blueprint $table) {
            $table->dropColumn('foto_carnet');
        });
    }
};
