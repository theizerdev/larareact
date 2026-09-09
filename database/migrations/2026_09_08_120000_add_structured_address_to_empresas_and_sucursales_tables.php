<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Incidencia 1 (Ubicación / Mapas): los formularios de Empresa y Sucursal sólo
 * guardaban `direccion` (texto libre) + lat/long. Para soportar la geocodificación
 * progresiva (país, estado, ciudad, colonia, dirección, código postal) sin perder
 * la dirección estructurada, se agregan columnas espejo a las de la tabla
 * `productores`, que ya sigue este patrón.
 *
 * Todas las columnas son nullable => retrocompatible. Los registros existentes
 * quedan intactos y las peticiones que no envíen estos campos siguen funcionando.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('empresas')) {
            Schema::table('empresas', function (Blueprint $table) {
                if (! Schema::hasColumn('empresas', 'estado')) {
                    $table->string('estado')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('empresas', 'ciudad')) {
                    $table->string('ciudad')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('empresas', 'colonia')) {
                    $table->string('colonia')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('empresas', 'codigo_postal')) {
                    $table->string('codigo_postal', 20)->nullable()->after('direccion');
                }
            });
        }

        if (Schema::hasTable('sucursales')) {
            Schema::table('sucursales', function (Blueprint $table) {
                if (! Schema::hasColumn('sucursales', 'pais_id')) {
                    $table->unsignedBigInteger('pais_id')->nullable()->after('empresa_id');
                    $table->foreign('pais_id')->references('id')->on('pais')->onDelete('set null');
                }
                if (! Schema::hasColumn('sucursales', 'estado')) {
                    $table->string('estado')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('sucursales', 'ciudad')) {
                    $table->string('ciudad')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('sucursales', 'colonia')) {
                    $table->string('colonia')->nullable()->after('direccion');
                }
                if (! Schema::hasColumn('sucursales', 'codigo_postal')) {
                    $table->string('codigo_postal', 20)->nullable()->after('direccion');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('empresas')) {
            Schema::table('empresas', function (Blueprint $table) {
                foreach (['estado', 'ciudad', 'colonia', 'codigo_postal'] as $col) {
                    if (Schema::hasColumn('empresas', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }

        if (Schema::hasTable('sucursales')) {
            if (Schema::hasColumn('sucursales', 'pais_id')) {
                Schema::table('sucursales', function (Blueprint $table) {
                    $table->dropForeign(['pais_id']);
                    $table->dropColumn('pais_id');
                });
            }

            Schema::table('sucursales', function (Blueprint $table) {
                foreach (['estado', 'ciudad', 'colonia', 'codigo_postal'] as $col) {
                    if (Schema::hasColumn('sucursales', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
