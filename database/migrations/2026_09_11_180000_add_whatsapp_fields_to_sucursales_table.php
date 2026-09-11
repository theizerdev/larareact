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
        Schema::table('sucursales', function (Blueprint $table) {
            if (! Schema::hasColumn('sucursales', 'whatsapp_instance')) {
                $table->string('whatsapp_instance')->nullable()->after('status');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_phone')) {
                $table->string('whatsapp_phone')->nullable()->after('whatsapp_instance');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_status')) {
                $table->string('whatsapp_status')->default('disconnected')->after('whatsapp_phone');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_last_connected')) {
                $table->timestamp('whatsapp_last_connected')->nullable()->after('whatsapp_status');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_active')) {
                $table->boolean('whatsapp_active')->default(false)->after('whatsapp_last_connected');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_rate_limit')) {
                $table->integer('whatsapp_rate_limit')->default(20)->after('whatsapp_active');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_warmup_mode')) {
                $table->boolean('whatsapp_warmup_mode')->default(false)->after('whatsapp_rate_limit');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_working_hours_enabled')) {
                $table->boolean('whatsapp_working_hours_enabled')->default(false)->after('whatsapp_warmup_mode');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_working_hours_start')) {
                $table->time('whatsapp_working_hours_start')->nullable()->after('whatsapp_working_hours_enabled');
            }
            if (! Schema::hasColumn('sucursales', 'whatsapp_working_hours_end')) {
                $table->time('whatsapp_working_hours_end')->nullable()->after('whatsapp_working_hours_start');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sucursales', function (Blueprint $table) {
            $columns = [
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

            foreach ($columns as $column) {
                if (Schema::hasColumn('sucursales', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

