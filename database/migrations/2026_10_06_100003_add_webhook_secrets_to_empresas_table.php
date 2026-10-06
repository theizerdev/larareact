<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Secretos de webhook por empresa (cast 'encrypted', por eso text):
     *  - didit_webhook_secret: el que DIDIT entrega al crear el destino; firma X-Signature-V2.
     *  - zapsign_webhook_secret: Hoshō lo genera y ZapSign lo devuelve en un header propio.
     */
    public function up(): void
    {
        foreach (['didit_webhook_secret', 'zapsign_webhook_secret'] as $nombre) {
            if (Schema::hasColumn('empresas', $nombre)) {
                continue;
            }

            Schema::table('empresas', function (Blueprint $table) use ($nombre) {
                $table->text($nombre)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['didit_webhook_secret', 'zapsign_webhook_secret'] as $nombre) {
            if (! Schema::hasColumn('empresas', $nombre)) {
                continue;
            }

            Schema::table('empresas', function (Blueprint $table) use ($nombre) {
                $table->dropColumn($nombre);
            });
        }
    }
};
