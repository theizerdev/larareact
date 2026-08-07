<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('productos', 'tipo_producto')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->enum('tipo_producto', ['venta', 'repuesto'])->default('venta')->after('condicion')->index();
            });

            // Actualizar productos cuya condición era 'repuesto'
            DB::table('productos')->where('condicion', 'repuesto')->update(['tipo_producto' => 'repuesto']);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('productos', 'tipo_producto')) {
            Schema::table('productos', function (Blueprint $table) {
                $table->dropColumn('tipo_producto');
            });
        }
    }
};
