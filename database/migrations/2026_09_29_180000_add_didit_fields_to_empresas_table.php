<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Añade la configuración de DIDIT (verificación de identidad) por empresa.
     *
     * Puramente aditiva: no toca ni borra ninguna columna existente. Cada
     * columna se agrega sólo si falta, evitando errores en entornos SQLite o MySQL.
     */
    public function up(): void
    {
        $columnas = [
            'didit_api_key' => fn (Blueprint $table) => $table->text('didit_api_key')->nullable(),
            'didit_workflow_id' => fn (Blueprint $table) => $table->string('didit_workflow_id', 100)->nullable(),
            'didit_active' => fn (Blueprint $table) => $table->boolean('didit_active')->default(false),
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
        foreach (['didit_api_key', 'didit_workflow_id', 'didit_active'] as $nombre) {
            if (! Schema::hasColumn('empresas', $nombre)) {
                continue;
            }

            Schema::table('empresas', function (Blueprint $table) use ($nombre) {
                $table->dropColumn($nombre);
            });
        }
    }
};
