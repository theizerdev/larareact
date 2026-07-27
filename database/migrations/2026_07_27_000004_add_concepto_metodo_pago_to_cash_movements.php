<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasColumn('cash_movements', 'concepto')) {
            Schema::table('cash_movements', function (Blueprint $table) {
                $table->string('concepto')->default('otro')->after('type');
                $table->string('metodo_pago')->default('efectivo')->after('concepto');
            });
        }
    }

    public function down(): void {
        Schema::table('cash_movements', function (Blueprint $table) {
            $table->dropColumn(['concepto', 'metodo_pago']);
        });
    }
};
