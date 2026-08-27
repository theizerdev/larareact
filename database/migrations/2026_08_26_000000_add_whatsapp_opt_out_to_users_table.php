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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'whatsapp_opt_out')) {
                $table->boolean('whatsapp_opt_out')->default(false)->after('telefono');
            }
            if (! Schema::hasColumn('users', 'whatsapp_unsubscribed_at')) {
                $table->timestamp('whatsapp_unsubscribed_at')->nullable()->after('whatsapp_opt_out');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('users', 'whatsapp_opt_out')) {
                $columnsToDrop[] = 'whatsapp_opt_out';
            }
            if (Schema::hasColumn('users', 'whatsapp_unsubscribed_at')) {
                $columnsToDrop[] = 'whatsapp_unsubscribed_at';
            }
            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
