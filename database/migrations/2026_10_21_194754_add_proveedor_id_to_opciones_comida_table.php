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
        Schema::table('opciones_comida', function (Blueprint $table) {
            $table->foreignId('proveedor_id')
                ->nullable()
                ->after('sucursal_id')
                ->constrained('proveedores')
                ->nullOnDelete();

            $table->index(['empresa_id', 'proveedor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('opciones_comida', function (Blueprint $table) {
            $table->dropForeign(['proveedor_id']);
            $table->dropIndex(['empresa_id', 'proveedor_id']);
            $table->dropColumn('proveedor_id');
        });
    }
};
