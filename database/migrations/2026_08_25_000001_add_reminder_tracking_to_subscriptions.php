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
        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                if (!Schema::hasColumn('subscriptions', 'last_reminder_sent_at')) {
                    $table->timestamp('last_reminder_sent_at')->nullable()->after('estado');
                }
                if (!Schema::hasColumn('subscriptions', 'reminder_sent_count')) {
                    $table->integer('reminder_sent_count')->default(0)->after('last_reminder_sent_at');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('subscriptions')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                $columns = [];
                if (Schema::hasColumn('subscriptions', 'last_reminder_sent_at')) {
                    $columns[] = 'last_reminder_sent_at';
                }
                if (Schema::hasColumn('subscriptions', 'reminder_sent_count')) {
                    $columns[] = 'reminder_sent_count';
                }
                if (!empty($columns)) {
                    $table->dropColumn($columns);
                }
            });
        }
    }
};
