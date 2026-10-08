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
        if (Schema::hasTable('sales_goals')) {
            Schema::table('sales_goals', function (Blueprint $table) {
                $table->decimal('increment_percentage', 12, 2)->default(0.00)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('sales_goals')) {
            Schema::table('sales_goals', function (Blueprint $table) {
                $table->decimal('increment_percentage', 5, 2)->default(0.00)->change();
            });
        }
    }
};
