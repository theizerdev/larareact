<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Añade la configuración de ZapSign (firma electrónica) por empresa.
     *
     * Puramente aditiva: no toca ni borra ninguna columna existente. Cada
     * columna se agrega sólo si falta, porque el entrypoint del contenedor
     * corre `migrate --force` en cada arranque y la base de producción es
     * SQLite (donde un ALTER TABLE fallido aborta el resto del despliegue).
     */
    public function up(): void
    {
        $columnas = [
            // text() en vez de string(): el valor cifrado (cast 'encrypted' en
            // el modelo) del token de 72 caracteres supera los 255 de VARCHAR.
            'zapsign_api_token' => fn (Blueprint $table) => $table->text('zapsign_api_token')->nullable(),
            'zapsign_environment' => fn (Blueprint $table) => $table->string('zapsign_environment', 20)->default('production'),
            'zapsign_active' => fn (Blueprint $table) => $table->boolean('zapsign_active')->default(false),
        ];

        foreach ($columnas as $nombre => $definicion) {
            if (Schema::hasColumn('empresas', $nombre)) {
                continue;
            }

            Schema::table('empresas', function (Blueprint $table) use ($definicion) {
                $definicion($table);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['zapsign_api_token', 'zapsign_environment', 'zapsign_active'] as $nombre) {
            if (! Schema::hasColumn('empresas', $nombre)) {
                continue;
            }

            Schema::table('empresas', function (Blueprint $table) use ($nombre) {
                $table->dropColumn($nombre);
            });
        }
    }
};
