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
            $columnsToDrop = [];

            $possibleColumns = [
                'whatsapp_instance',
                'whatsapp_phone',
                'whatsapp_status',
                'whatsapp_last_connected',
                'whatsapp_active',
                'whatsapp_rate_limit',
                'whatsapp_warmup_mode',
                'whatsapp_working_hours_enabled',
                'whatsapp_working_hours_start',
                'whatsapp_working_hours_end',
            ];

            foreach ($possibleColumns as $col) {
                if (Schema::hasColumn('empresas', $col)) {
                    $columnsToDrop[] = $col;
                }
            }

            if (! empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('whatsapp_instance', 100)->nullable();
            $table->string('whatsapp_phone', 20)->nullable();
            $table->string('whatsapp_status', 30)->default('disconnected');
            $table->timestamp('whatsapp_last_connected')->nullable();
            $table->boolean('whatsapp_active')->default(false);
            $table->integer('whatsapp_rate_limit')->default(300);
            $table->boolean('whatsapp_warmup_mode')->default(true);
            $table->boolean('whatsapp_working_hours_enabled')->default(true);
            $table->string('whatsapp_working_hours_start', 10)->default('08:00');
            $table->string('whatsapp_working_hours_end', 10)->default('20:00');
        });
    }
};
