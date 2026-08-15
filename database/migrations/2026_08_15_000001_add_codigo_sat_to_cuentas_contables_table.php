<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('cuentas_contables') && !Schema::hasColumn('cuentas_contables', 'codigo_sat')) {
            Schema::table('cuentas_contables', function (Blueprint $table) {
                $table->string('codigo_sat', 20)->nullable()->after('codigo');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('cuentas_contables') && Schema::hasColumn('cuentas_contables', 'codigo_sat')) {
            Schema::table('cuentas_contables', function (Blueprint $table) {
                $table->dropColumn('codigo_sat');
            });
        }
    }
};
