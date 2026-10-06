<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Las validaciones de identidad ya no son sólo de JAAK: el pasaporte y los
     * documentos extranjeros van a DIDIT, y DIDIT puede correr además como capa
     * antifraude encima de JAAK. Aditiva: los registros viejos quedan como 'jaak'.
     */
    public function up(): void
    {
        $columnas = [
            'proveedor' => fn (Blueprint $t) => $t->string('proveedor', 20)->default('jaak')->index(),
            'tipo_documento' => fn (Blueprint $t) => $t->string('tipo_documento', 20)->nullable(),
            'pais_documento' => fn (Blueprint $t) => $t->string('pais_documento', 3)->nullable(),
            'didit_session_id' => fn (Blueprint $t) => $t->string('didit_session_id', 64)->nullable()->index(),
            'didit_url' => fn (Blueprint $t) => $t->text('didit_url')->nullable(),
            'didit_estatus' => fn (Blueprint $t) => $t->string('didit_estatus', 30)->nullable(),
        ];

        foreach ($columnas as $nombre => $definicion) {
            if (Schema::hasColumn('kyc_validaciones', $nombre)) {
                continue;
            }

            Schema::table('kyc_validaciones', function (Blueprint $table) use ($definicion) {
                $definicion($table);
            });
        }
    }

    public function down(): void
    {
        foreach (['proveedor', 'tipo_documento', 'pais_documento', 'didit_session_id', 'didit_url', 'didit_estatus'] as $nombre) {
            if (! Schema::hasColumn('kyc_validaciones', $nombre)) {
                continue;
            }

            Schema::table('kyc_validaciones', function (Blueprint $table) use ($nombre) {
                if (in_array($nombre, ['proveedor', 'didit_session_id'], true)) {
                    $table->dropIndex([$nombre]);
                }
                $table->dropColumn($nombre);
            });
        }
    }
};
