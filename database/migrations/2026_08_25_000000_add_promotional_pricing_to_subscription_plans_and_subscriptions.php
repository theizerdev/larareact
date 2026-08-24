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
        Schema::table('subscription_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('subscription_plans', 'precio_regular_mensual')) {
                $table->decimal('precio_regular_mensual', 10, 2)->default(0.00)->after('precio_12_meses');
            }
            if (!Schema::hasColumn('subscription_plans', 'precio_promocional_mensual')) {
                $table->decimal('precio_promocional_mensual', 10, 2)->default(0.00)->after('precio_regular_mensual');
            }
            if (!Schema::hasColumn('subscription_plans', 'tiene_promocion')) {
                $table->boolean('tiene_promocion')->default(false)->after('precio_promocional_mensual');
            }
            if (!Schema::hasColumn('subscription_plans', 'meses_duracion_promocion')) {
                $table->integer('meses_duracion_promocion')->default(3)->after('tiene_promocion');
            }
            if (!Schema::hasColumn('subscription_plans', 'badge_promocion')) {
                $table->string('badge_promocion')->nullable()->after('meses_duracion_promocion');
            }
            if (!Schema::hasColumn('subscription_plans', 'destacado')) {
                $table->boolean('destacado')->default(false)->after('badge_promocion');
            }
            if (!Schema::hasColumn('subscription_plans', 'orden')) {
                $table->integer('orden')->default(0)->after('destacado');
            }
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('subscriptions', 'es_tarifa_promocional')) {
                $table->boolean('es_tarifa_promocional')->default(false)->after('monto_total');
            }
            if (!Schema::hasColumn('subscriptions', 'fecha_fin_promocion')) {
                $table->timestamp('fecha_fin_promocion')->nullable()->after('es_tarifa_promocional');
            }
            if (!Schema::hasColumn('subscriptions', 'monto_renovacion_regular')) {
                $table->decimal('monto_renovacion_regular', 10, 2)->default(0.00)->after('fecha_fin_promocion');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table) {
            $table->dropColumn([
                'precio_regular_mensual',
                'precio_promocional_mensual',
                'tiene_promocion',
                'meses_duracion_promocion',
                'badge_promocion',
                'destacado',
                'orden',
            ]);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn([
                'es_tarifa_promocional',
                'fecha_fin_promocion',
                'monto_renovacion_regular',
            ]);
        });
    }
};
