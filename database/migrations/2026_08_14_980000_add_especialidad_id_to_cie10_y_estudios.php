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
        Schema::table('diagnosticos_cie10', function (Blueprint $table) {
            $table->foreignId('especialidad_id')->nullable()->after('empresa_id')->constrained('especialidades')->onDelete('cascade');
        });

        Schema::table('catalogo_estudios', function (Blueprint $table) {
            $table->foreignId('especialidad_id')->nullable()->after('empresa_id')->constrained('especialidades')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('diagnosticos_cie10', function (Blueprint $table) {
            $table->dropForeign(['especialidad_id']);
            $table->dropColumn('especialidad_id');
        });

        Schema::table('catalogo_estudios', function (Blueprint $table) {
            $table->dropForeign(['especialidad_id']);
            $table->dropColumn('especialidad_id');
        });
    }
};
