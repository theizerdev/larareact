<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migración para agregar campos adicionales de WhatsApp multi-empresa.
 * 
 * NOTA: Los campos whatsapp_api_key, whatsapp_rate_limit y whatsapp_active
 * ya fueron creados en la migración 2025_12_04_000000_add_whatsapp_api_key_to_empresas_table.php
 * 
 * Esta migración solo agrega los campos adicionales para el soporte multi-empresa:
 * - whatsapp_phone: Número de WhatsApp conectado
 * - whatsapp_status: Estado de conexión (disconnected, connecting, connected, qr_ready)
 * - whatsapp_last_connected: Última vez que se conectó
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            // Solo agregar campos que no existen aún (los nuevos para multi-empresa)
            
            // Número de WhatsApp conectado
            if (!Schema::hasColumn('empresas', 'whatsapp_phone')) {
                $table->string('whatsapp_phone', 20)->nullable()->after('whatsapp_active')
                    ->comment('Número de WhatsApp conectado');
            }
            
            // Estado de conexión de WhatsApp
            if (!Schema::hasColumn('empresas', 'whatsapp_status')) {
                $table->enum('whatsapp_status', ['disconnected', 'connecting', 'connected', 'qr_ready'])
                    ->default('disconnected')->after('whatsapp_phone')
                    ->comment('Estado de conexión de WhatsApp');
            }
            
            // Última vez que se conectó WhatsApp
            if (!Schema::hasColumn('empresas', 'whatsapp_last_connected')) {
                $table->timestamp('whatsapp_last_connected')->nullable()->after('whatsapp_status')
                    ->comment('Última vez que se conectó WhatsApp');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            // Solo eliminar los campos que agregamos en esta migración
            $columns = [
                'whatsapp_phone',
                'whatsapp_status',
                'whatsapp_last_connected'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('empresas', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
