<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add JSON column to familias table for common specifications
        Schema::table('familias', function (Blueprint $table) {
            $table->json('specs_json')->nullable()->after('nombre');
        });

        // Add JSON column to modelos table for model‑specific overrides
        Schema::table('modelos', function (Blueprint $table) {
            $table->json('specs_overrides')->nullable()->after('nombre_comercial');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('familias', function (Blueprint $table) {
            $table->dropColumn('specs_json');
        });

        Schema::table('modelos', function (Blueprint $table) {
            $table->dropColumn('specs_overrides');
        });
    }
};
?>
