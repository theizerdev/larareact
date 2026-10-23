<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
            $table->string('nuevo_marca', 120)->nullable()->after('actual_comentario');
            $table->string('nuevo_modelo', 120)->nullable()->after('nuevo_marca');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
            $table->dropColumn(['nuevo_marca', 'nuevo_modelo']);
        });
    }
};

