<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('servicios', 'categoria_id')) {
            Schema::table('servicios', function (Blueprint $table) {
                $table->foreignId('categoria_id')->nullable()->after('sucursal_id')->constrained('categorias')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('servicios', 'categoria_id')) {
            Schema::table('servicios', function (Blueprint $table) {
                $table->dropForeign(['categoria_id']);
                $table->dropColumn('categoria_id');
            });
        }
    }
};
