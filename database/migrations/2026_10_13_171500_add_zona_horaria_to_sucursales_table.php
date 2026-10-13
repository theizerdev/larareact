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
        Schema::table('sucursales', function (Blueprint $table) {
            if (!Schema::hasColumn('sucursales', 'zona_horaria')) {
                $table->string('zona_horaria', 100)->nullable()->after('longitud');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            if (Schema::hasColumn('sucursales', 'zona_horaria')) {
                $table->dropColumn('zona_horaria');
            }
        });
    }
};
