<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                if (! Schema::hasColumn('subscription_plans', 'ciclo_meses')) {
                    $table->integer('ciclo_meses')->default(1)->after('orden');
                }
                if (! Schema::hasColumn('subscription_plans', 'max_suscripciones')) {
                    $table->integer('max_suscripciones')->nullable()->after('ciclo_meses');
                }
                if (! Schema::hasColumn('subscription_plans', 'fecha_expiracion')) {
                    $table->timestamp('fecha_expiracion')->nullable()->after('max_suscripciones');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                foreach (['ciclo_meses', 'max_suscripciones', 'fecha_expiracion'] as $column) {
                    if (Schema::hasColumn('subscription_plans', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
