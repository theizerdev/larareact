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
        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('rfc')->nullable()->after('nombre_comercial');
            $table->string('curp', 18)->nullable()->after('responsable');
        });

        Schema::table('productores', function (Blueprint $table) {
            $table->string('rfc')->nullable()->after('nombre_comercial');
            $table->string('curp', 18)->nullable()->after('responsable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            $table->dropColumn(['rfc', 'curp']);
        });

        Schema::table('productores', function (Blueprint $table) {
            $table->dropColumn(['rfc', 'curp']);
        });
    }
};
