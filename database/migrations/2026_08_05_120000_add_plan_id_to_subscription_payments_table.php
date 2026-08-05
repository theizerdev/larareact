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
        if (! Schema::hasColumn('subscription_payments', 'plan_id')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                $table->foreignId('plan_id')->nullable()->after('subscription_id')->constrained('subscription_plans')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('subscription_payments', 'plan_id')) {
            Schema::table('subscription_payments', function (Blueprint $table) {
                $table->dropForeign(['plan_id']);
                $table->dropColumn('plan_id');
            });
        }
    }
};
