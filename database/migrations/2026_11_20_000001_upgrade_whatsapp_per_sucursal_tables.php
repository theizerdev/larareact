<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('sucursales')) {
            Schema::table('sucursales', function (Blueprint $table) {
                if (! Schema::hasColumn('sucursales', 'whatsapp_hourly_limit')) {
                    $table->integer('whatsapp_hourly_limit')->default(25)->after('whatsapp_rate_limit');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_simulate_typing')) {
                    $table->boolean('whatsapp_simulate_typing')->default(true)->after('whatsapp_working_hours_end');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_typing_min_sec')) {
                    $table->decimal('whatsapp_typing_min_sec', 4, 1)->default(2.0)->after('whatsapp_simulate_typing');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_typing_max_sec')) {
                    $table->decimal('whatsapp_typing_max_sec', 4, 1)->default(6.0)->after('whatsapp_typing_min_sec');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_delay_min_sec')) {
                    $table->integer('whatsapp_delay_min_sec')->default(8)->after('whatsapp_typing_max_sec');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_delay_max_sec')) {
                    $table->integer('whatsapp_delay_max_sec')->default(20)->after('whatsapp_delay_min_sec');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_batch_size')) {
                    $table->integer('whatsapp_batch_size')->default(10)->after('whatsapp_delay_max_sec');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_batch_pause_sec')) {
                    $table->integer('whatsapp_batch_pause_sec')->default(60)->after('whatsapp_batch_size');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_verify_number')) {
                    $table->boolean('whatsapp_verify_number')->default(true)->after('whatsapp_batch_pause_sec');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_queue_paused')) {
                    $table->boolean('whatsapp_queue_paused')->default(false)->after('whatsapp_verify_number');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_proxy_url')) {
                    $table->string('whatsapp_proxy_url', 255)->nullable()->after('whatsapp_queue_paused');
                }
                if (! Schema::hasColumn('sucursales', 'whatsapp_connected_at')) {
                    $table->timestamp('whatsapp_connected_at')->nullable()->after('whatsapp_last_connected');
                }
            });
        }

        if (Schema::hasTable('whatsapp_messages')) {
            Schema::table('whatsapp_messages', function (Blueprint $table) {
                if (! Schema::hasColumn('whatsapp_messages', 'empresa_id')) {
                    $table->unsignedBigInteger('empresa_id')->nullable()->after('id')->index();
                }
                if (! Schema::hasColumn('whatsapp_messages', 'sucursal_id')) {
                    $table->unsignedBigInteger('sucursal_id')->nullable()->after('empresa_id')->index();
                }
                if (! Schema::hasColumn('whatsapp_messages', 'instance_name')) {
                    $table->string('instance_name', 120)->nullable()->after('sucursal_id')->index();
                }
                if (! Schema::hasColumn('whatsapp_messages', 'scheduled_at')) {
                    $table->timestamp('scheduled_at')->nullable()->after('sent_at')->index();
                }
            });

            // Permitir estados extendidos (queued, sending, cancelled) en MySQL/MariaDB
            if (in_array(Schema::getConnection()->getDriverName(), ['mysql', 'mariadb'], true)) {
                DB::statement("ALTER TABLE whatsapp_messages MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'pending'");
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('sucursales')) {
            Schema::table('sucursales', function (Blueprint $table) {
                $cols = [
                    'whatsapp_hourly_limit',
                    'whatsapp_simulate_typing',
                    'whatsapp_typing_min_sec',
                    'whatsapp_typing_max_sec',
                    'whatsapp_delay_min_sec',
                    'whatsapp_delay_max_sec',
                    'whatsapp_batch_size',
                    'whatsapp_batch_pause_sec',
                    'whatsapp_verify_number',
                    'whatsapp_queue_paused',
                    'whatsapp_proxy_url',
                    'whatsapp_connected_at',
                ];
                foreach ($cols as $col) {
                    if (Schema::hasColumn('sucursales', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('whatsapp_messages')) {
            Schema::table('whatsapp_messages', function (Blueprint $table) {
                foreach (['empresa_id', 'sucursal_id', 'instance_name', 'scheduled_at'] as $col) {
                    if (Schema::hasColumn('whatsapp_messages', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
