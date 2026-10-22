<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('empresas', 'primary_payment_gateway')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->string('primary_payment_gateway', 50)->default('stripe')->after('stripe_webhook_secret');
            });

            DB::table('empresas')->update([
                'primary_payment_gateway' => 'stripe',
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('empresas', 'primary_payment_gateway')) {
            Schema::table('empresas', function (Blueprint $table) {
                $table->dropColumn('primary_payment_gateway');
            });
        }
    }
};
