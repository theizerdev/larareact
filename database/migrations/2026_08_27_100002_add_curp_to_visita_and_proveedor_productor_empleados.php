<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * CURP a nivel de persona para las entidades que aún no la tienen. `empleados`
     * ya la recibió en 2026_08_11_100008_add_curp_to_empleados_table.
     *
     * Es el dato que el wizard de pre-registro pide y que se manda a JAAK para
     * la validación RENAPO (paso 6). Nullable: nunca bloquea el registro.
     */
    private array $tables = [
        'proveedor_empleados',
        'productor_empleados',
        'visitas_temporales',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'curp')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->string('curp', 18)->nullable()->after('documento_identidad');
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'curp')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('curp');
                });
            }
        }
    }
};
