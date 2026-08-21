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
        Schema::table('empleados', function (Blueprint $table) {
            $table->decimal('salario_diario', 10, 2)->nullable()->after('status');
            $table->foreignId('turno_laboral_id')->nullable()->after('salario_diario')->constrained('turnos_laborales')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropForeign(['turno_laboral_id']);
            $table->dropColumn(['salario_diario', 'turno_laboral_id']);
        });
    }
};
