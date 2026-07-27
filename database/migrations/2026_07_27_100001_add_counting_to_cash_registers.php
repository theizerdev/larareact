<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->decimal('counted_amount', 15, 2)->nullable()->after('closing_amount');
            $table->decimal('expected_amount', 15, 2)->nullable()->after('counted_amount');
            $table->decimal('difference', 15, 2)->nullable()->after('expected_amount');
        });
    }

    public function down(): void {
        Schema::table('cash_registers', function (Blueprint $table) {
            $table->dropColumn(['counted_amount', 'expected_amount', 'difference']);
        });
    }
};
