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
            // Conexión a BioTime PRO (ZKTeco BioTime 8.0). Integración de
            // SOLO LECTURA: se leen relojes, empleados, catálogos, marcajes y
            // fotos. Nunca se escribe en BioTime.
            $table->string('biotime_base_url')->nullable()->after('jaak_active');
            $table->string('biotime_username')->nullable()->after('biotime_base_url');
            // text() porque el valor cifrado (cast 'encrypted' en el modelo)
            // supera con facilidad los 255 caracteres de un VARCHAR.
            $table->text('biotime_password')->nullable()->after('biotime_username');
            $table->boolean('biotime_active')->default(false)->after('biotime_password');
            // Marca de agua para la sincronización incremental de marcajes.
            $table->timestamp('biotime_last_sync_at')->nullable()->after('biotime_active');
            $table->unsignedBigInteger('biotime_last_transaction_id')->nullable()->after('biotime_last_sync_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'biotime_base_url',
                'biotime_username',
                'biotime_password',
                'biotime_active',
                'biotime_last_sync_at',
                'biotime_last_transaction_id',
            ]);
        });
    }
};
