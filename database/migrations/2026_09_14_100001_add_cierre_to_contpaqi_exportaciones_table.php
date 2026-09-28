<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Cierre del período: la constancia de que el archivo ya se importó en
     * CONTPAQi y la nómina se pagó con él.
     *
     * Hasta ahora el ciclo terminaba en 'descargada', que sólo dice que alguien
     * se llevó el archivo. Con dos o tres exportaciones del mismo período no
     * había manera de saber cuál fue la buena, y nada impedía regenerar un
     * período ya pagado y confundir a contabilidad con un segundo archivo.
     */
    public function up(): void
    {
        // MySQL amplía el ENUM en sitio. SQLite (las pruebas) no soporta
        // ALTER de ese tipo, pero Laravel recrea la tabla con change().
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contpaqi_exportaciones MODIFY COLUMN estado ENUM('generando', 'generada', 'descargada', 'cerrada', 'error') NOT NULL DEFAULT 'generando'");
        } else {
            Schema::table('contpaqi_exportaciones', function (Blueprint $table) {
                $table->enum('estado', ['generando', 'generada', 'descargada', 'cerrada', 'error'])
                    ->default('generando')
                    ->change();
            });
        }

        Schema::table('contpaqi_exportaciones', function (Blueprint $table) {
            $table->foreignId('cerrada_por')
                ->nullable()
                ->after('generada_at')
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('cerrada_at')->nullable()->after('cerrada_por');
        });
    }

    public function down(): void
    {
        Schema::table('contpaqi_exportaciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cerrada_por');
            $table->dropColumn('cerrada_at');
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE contpaqi_exportaciones MODIFY COLUMN estado ENUM('generando', 'generada', 'descargada', 'error') NOT NULL DEFAULT 'generando'");
        }
    }
};
