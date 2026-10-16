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
        Schema::table('empresas', function (Blueprint $table) {
            if (!Schema::hasColumn('empresas', 'nombre_comercial')) {
                $table->string('nombre_comercial')->nullable()->after('razon_social');
            }
            if (!Schema::hasColumn('empresas', 'curp_representante_legal')) {
                $table->string('curp_representante_legal', 18)->nullable()->after('representante_legal');
            }
            if (!Schema::hasColumn('empresas', 'zona_horaria')) {
                $table->string('zona_horaria', 100)->nullable()->after('longitud');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            if (Schema::hasColumn('empresas', 'zona_horaria')) {
                $table->dropColumn('zona_horaria');
            }
            if (Schema::hasColumn('empresas', 'curp_representante_legal')) {
                $table->dropColumn('curp_representante_legal');
            }
            if (Schema::hasColumn('empresas', 'nombre_comercial')) {
                $table->dropColumn('nombre_comercial');
            }
        });
    }
};
