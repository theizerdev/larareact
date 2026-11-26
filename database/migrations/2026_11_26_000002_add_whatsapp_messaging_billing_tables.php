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
                if (! Schema::hasColumn('subscription_plans', 'costo_por_mensaje_usd')) {
                    $table->decimal('costo_por_mensaje_usd', 8, 4)->default(0.0050)->after('precio_sucursal_extra_mensual');
                }
                if (! Schema::hasColumn('subscription_plans', 'mensajes_incluidos_mes')) {
                    $table->integer('mensajes_incluidos_mes')->default(60)->after('costo_por_mensaje_usd');
                }
                if (! Schema::hasColumn('subscription_plans', 'min_compra_mensajes')) {
                    $table->integer('min_compra_mensajes')->default(100)->after('mensajes_incluidos_mes');
                }
            });
        }

        if (Schema::hasTable('empresas')) {
            Schema::table('empresas', function (Blueprint $table) {
                if (! Schema::hasColumn('empresas', 'whatsapp_balance_usd')) {
                    $table->decimal('whatsapp_balance_usd', 10, 4)->default(0.0000)->after('whatsapp_api_key');
                }
                if (! Schema::hasColumn('empresas', 'whatsapp_messages_used_cycle')) {
                    $table->integer('whatsapp_messages_used_cycle')->default(0)->after('whatsapp_balance_usd');
                }
                if (! Schema::hasColumn('empresas', 'whatsapp_cycle_reset_at')) {
                    $table->timestamp('whatsapp_cycle_reset_at')->nullable()->after('whatsapp_messages_used_cycle');
                }
            });
        }

        if (Schema::hasTable('subscription_payments')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                if (! Schema::hasColumn('subscription_payments', 'tipo_pago')) {
                    $table->string('tipo_pago', 30)->default('subscription')->after('plan_id');
                }
                if (! Schema::hasColumn('subscription_payments', 'mensajes_comprados')) {
                    $table->integer('mensajes_comprados')->nullable()->after('tipo_pago');
                }
            });
        }

        if (! Schema::hasTable('whatsapp_pricing_settings')) {
            Schema::create('whatsapp_pricing_settings', function (Blueprint $table) {
                $table->id();
                $table->decimal('costo_por_mensaje_usd', 8, 4)->default(0.0050);
                $table->integer('mensajes_gratis_defecto')->default(60);
                $table->integer('min_compra_mensajes')->default(100);
                $table->json('paquetes_recarga')->nullable();
                $table->boolean('cobro_activo')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('whatsapp_wallet_transactions')) {
            Schema::create('whatsapp_wallet_transactions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('empresa_id')->index();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('tipo', 30)->index(); // free_quota, charge, topup, refund, adjustment
                $table->decimal('monto_usd', 10, 4)->default(0.0000);
                $table->decimal('saldo_anterior', 10, 4)->default(0.0000);
                $table->decimal('saldo_nuevo', 10, 4)->default(0.0000);
                $table->unsignedBigInteger('whatsapp_message_id')->nullable()->index();
                $table->unsignedBigInteger('subscription_payment_id')->nullable()->index();
                $table->string('descripcion', 255)->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_wallet_transactions');
        Schema::dropIfExists('whatsapp_pricing_settings');

        if (Schema::hasTable('subscription_payments')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                foreach (['tipo_pago', 'mensajes_comprados'] as $col) {
                    if (Schema::hasColumn('subscription_payments', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('empresas')) {
            Schema::table('empresas', function (Blueprint $table) {
                foreach (['whatsapp_balance_usd', 'whatsapp_messages_used_cycle', 'whatsapp_cycle_reset_at'] as $col) {
                    if (Schema::hasColumn('empresas', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('subscription_plans')) {
            Schema::table('subscription_plans', function (Blueprint $table) {
                foreach (['costo_por_mensaje_usd', 'mensajes_incluidos_mes', 'min_compra_mensajes'] as $col) {
                    if (Schema::hasColumn('subscription_plans', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
