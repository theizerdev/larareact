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
            // Características de instalación
            $table->string('dimensiones', 120)->nullable()->after('ubicacion_fisica');
            $table->string('instalacion_fisica', 255)->nullable()->after('dimensiones');
            $table->text('instalacion_comentario')->nullable()->after('instalacion_fisica');
            $table->string('instalacion_foto', 500)->nullable()->after('instalacion_comentario');

            // Equipo Inicial
            $table->string('actual_marca', 120)->nullable()->after('instalacion_foto');
            $table->string('actual_modelo', 120)->nullable()->after('actual_marca');
            $table->string('actual_mac_address', 60)->nullable()->after('actual_gateway');
            $table->string('actual_foto', 500)->nullable()->after('actual_comentario');

            // Equipo Final
            $table->string('nuevo_foto', 500)->nullable()->after('nuevo_mac_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
            $table->dropColumn([
                'dimensiones',
                'instalacion_fisica',
                'instalacion_comentario',
                'instalacion_foto',
                'actual_marca',
                'actual_modelo',
                'actual_mac_address',
                'actual_foto',
                'nuevo_foto',
            ]);
        });
    }
};

