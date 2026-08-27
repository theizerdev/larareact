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
            if (! Schema::hasColumn('empresas', 'whatsapp_warmup_mode')) {
                $table->boolean('whatsapp_warmup_mode')->default(true)->after('whatsapp_rate_limit');
            }
            if (! Schema::hasColumn('empresas', 'whatsapp_working_hours_enabled')) {
                $table->boolean('whatsapp_working_hours_enabled')->default(true)->after('whatsapp_warmup_mode');
            }
            if (! Schema::hasColumn('empresas', 'whatsapp_working_hours_start')) {
                $table->string('whatsapp_working_hours_start', 10)->default('08:00')->after('whatsapp_working_hours_enabled');
            }
            if (! Schema::hasColumn('empresas', 'whatsapp_working_hours_end')) {
                $table->string('whatsapp_working_hours_end', 10)->default('20:00')->after('whatsapp_working_hours_start');
            }
            if (! Schema::hasColumn('empresas', 'whatsapp_proxy_url')) {
                $table->string('whatsapp_proxy_url', 255)->nullable()->after('whatsapp_working_hours_end');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $columns = [
                'whatsapp_warmup_mode',
                'whatsapp_working_hours_enabled',
                'whatsapp_working_hours_start',
                'whatsapp_working_hours_end',
                'whatsapp_proxy_url',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('empresas', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
