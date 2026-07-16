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
        Schema::table('visitas_temporales', function (Blueprint $table) {
            $table->foreignId('tipo_servicio_id')
                ->nullable()
                ->after('responsable_id')
                ->constrained('tipo_servicios')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas_temporales', function (Blueprint $table) {
            $table->dropForeign(['tipo_servicio_id']);
            $table->dropColumn('tipo_servicio_id');
        });
    }
};
