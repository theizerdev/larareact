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
                if (! Schema::hasColumn('subscription_plans', 'max_mensajes_acumulados')) {
                    $table->integer('max_mensajes_acumulados')->default(1000)->after('mensajes_incluidos_mes');
                }
            });
        }

        if (Schema::hasTable('whatsapp_pricing_settings')) {
            Schema::table('whatsapp_pricing_settings', function (Blueprint $table) {
                if (! Schema::hasColumn('whatsapp_pricing_settings', 'max_mensajes_acumulados_defecto')) {
                    $table->integer('max_mensajes_acumulados_defecto')->default(1000)->after('mensajes_gratis_defecto');
                }
            });
        }

        if (Schema::hasTable('empresas')) {
            Schema::table('empresas', function (Blueprint $table) {
                if (! Schema::hasColumn('empresas', 'whatsapp_rollover_messages')) {
                    $table->integer('whatsapp_rollover_messages')->default(0)->after('whatsapp_messages_used_cycle');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('empresas') && Schema::hasColumn('empresas', 'whatsapp_rollover_messages')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->dropColumn('whatsapp_rollover_messages');
            });
        }
        if (Schema::hasTable('whatsapp_pricing_settings') && Schema::hasColumn('whatsapp_pricing_settings', 'max_mensajes_acumulados_defecto')) {
            Schema::table('whatsapp_pricing_settings', function (Blueprint $table) {
                $table->dropColumn('max_mensajes_acumulados_defecto');
            });
        }
        if (Schema::hasTable('subscription_plans') && Schema::hasColumn('subscription_plans', 'max_mensajes_acumulados')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                $table->dropColumn('max_mensajes_acumulados');
            });
        }
    }
};
