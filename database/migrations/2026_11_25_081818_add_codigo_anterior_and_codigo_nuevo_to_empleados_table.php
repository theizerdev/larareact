<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->string('codigo_anterior', 50)->nullable()->after('documento_identidad');
            $table->string('codigo_nuevo', 50)->nullable()->after('codigo_anterior');
            $table->index('codigo_anterior');
            $table->index('codigo_nuevo');
        });

        // Poblar codigo_nuevo con documento_identidad para registros existentes
        DB::statement('UPDATE empleados SET codigo_nuevo = documento_identidad WHERE codigo_nuevo IS NULL AND documento_identidad IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropIndex(['codigo_anterior']);
            $table->dropIndex(['codigo_nuevo']);
            $table->dropColumn(['codigo_anterior', 'codigo_nuevo']);
        });
    }
};
