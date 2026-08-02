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
        Schema::table('empresas', function (Blueprint $table) {
            // PayPal SaaS Gateway Credentials
            $table->boolean('paypal_active')->default(false)->after('google_maps_active');
            $table->string('paypal_mode', 10)->default('sandbox')->after('paypal_active');
            $table->string('paypal_client_id')->nullable()->after('paypal_mode');
            $table->text('paypal_client_secret')->nullable()->after('paypal_client_id');

            // Mercado Pago SaaS Gateway Credentials
            $table->boolean('mercadopago_active')->default(false)->after('paypal_client_secret');
            $table->string('mercadopago_mode', 10)->default('sandbox')->after('mercadopago_active');
            $table->string('mercadopago_public_key')->nullable()->after('mercadopago_mode');
            $table->text('mercadopago_access_token')->nullable()->after('mercadopago_public_key');

            // Stripe SaaS Gateway Credentials
            $table->boolean('stripe_active')->default(false)->after('mercadopago_access_token');
            $table->string('stripe_mode', 10)->default('test')->after('stripe_active');
            $table->string('stripe_publishable_key')->nullable()->after('stripe_mode');
            $table->text('stripe_secret_key')->nullable()->after('stripe_publishable_key');
            $table->text('stripe_webhook_secret')->nullable()->after('stripe_secret_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'paypal_active',
                'paypal_mode',
                'paypal_client_id',
                'paypal_client_secret',
                'mercadopago_active',
                'mercadopago_mode',
                'mercadopago_public_key',
                'mercadopago_access_token',
                'stripe_active',
                'stripe_mode',
                'stripe_publishable_key',
                'stripe_secret_key',
                'stripe_webhook_secret',
            ]);
        });
    }
};
