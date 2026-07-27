<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('cash_registers', 'empresa_id')) {
            Schema::table('cash_registers', function (Blueprint $table) {
                $table->foreignId('empresa_id')->nullable()->after('id')->constrained('empresas')->onDelete('set null');
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->onDelete('set null');
            });
        }

        if (!Schema::hasColumn('cash_movements', 'empresa_id')) {
            Schema::table('cash_movements', function (Blueprint $table) {
                $table->foreignId('empresa_id')->nullable()->after('cash_register_id')->constrained('empresas')->onDelete('set null');
                $table->foreignId('sucursal_id')->nullable()->after('empresa_id')->constrained('sucursales')->onDelete('set null');
            });
        }
    }

    public function down(): void {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn(['empresa_id', 'sucursal_id']);
        });

        Schema::table('cash_movements', function (Blueprint $table) {
            $table->dropForeign(['empresa_id']);
            $table->dropForeign(['sucursal_id']);
            $table->dropColumn(['empresa_id', 'sucursal_id']);
        });
    }
};
