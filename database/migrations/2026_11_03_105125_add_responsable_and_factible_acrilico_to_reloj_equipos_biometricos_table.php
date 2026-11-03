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
            // Bloque Inicial
            $table->string('actual_responsable', 150)->nullable()->after('actual_comentario');
            $table->string('actual_factible_acrilico', 50)->nullable()->after('actual_responsable');

            // Bloque Final
            $table->string('nuevo_responsable', 150)->nullable()->after('nuevo_comentario');
            $table->string('nuevo_factible_acrilico', 50)->nullable()->after('nuevo_responsable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
            $table->dropColumn([
                'actual_responsable',
                'actual_factible_acrilico',
                'nuevo_responsable',
                'nuevo_factible_acrilico',
            ]);
        });
    }
};
