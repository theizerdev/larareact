<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            $table->foreignId('pais_telefono_id')
                  ->nullable()
                  ->after('telefono')
                  ->constrained('pais')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            $table->dropForeign(['pais_telefono_id']);
            $table->dropColumn('pais_telefono_id');
        });
    }
};
