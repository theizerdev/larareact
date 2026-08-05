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
        if (! Schema::hasColumn('empresas', 'nombre_comercial')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('nombre_comercial')->nullable()->after('razon_social');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('empresas', 'nombre_comercial')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->dropColumn('nombre_comercial');
            });
        }
    }
};
