<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('servicios', function (Blueprint $table) {
            if (!Schema::hasColumn('servicios', 'marca_id')) {
                $table->foreignId('marca_id')->nullable()->after('categoria_id')->constrained('marcas')->onDelete('set null');
            }
            if (!Schema::hasColumn('servicios', 'modelo_id')) {
                $table->foreignId('modelo_id')->nullable()->after('marca_id')->constrained('modelos')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('servicios', function (Blueprint $table) {
            if (Schema::hasColumn('servicios', 'modelo_id')) {
                $table->dropForeign(['modelo_id']);
                $table->dropColumn('modelo_id');
            }
            if (Schema::hasColumn('servicios', 'marca_id')) {
                $table->dropForeign(['marca_id']);
                $table->dropColumn('marca_id');
            }
        });
    }
};
