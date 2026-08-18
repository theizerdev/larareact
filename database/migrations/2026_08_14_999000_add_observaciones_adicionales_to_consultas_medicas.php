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
        Schema::table('consultas_medicas', function (Blueprint $table) {
            if (!Schema::hasColumn('consultas_medicas', 'observaciones_adicionales')) {
                $table->text('observaciones_adicionales')->nullable()->after('plan_tratamiento');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultas_medicas', function (Blueprint $table) {
            if (Schema::hasColumn('consultas_medicas', 'observaciones_adicionales')) {
                $table->dropColumn('observaciones_adicionales');
            }
        });
    }
};
