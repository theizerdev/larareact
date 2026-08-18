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
            if (!Schema::hasColumn('consultas_medicas', 'conclusion')) {
                $table->text('conclusion')->nullable()->after('observaciones_diagnostico');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultas_medicas', function (Blueprint $table) {
            if (Schema::hasColumn('consultas_medicas', 'conclusion')) {
                $table->dropColumn('conclusion');
            }
        });
    }
};
