<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Estatus KYC "vigente" denormalizado en cada tabla de personas, para pintar el
     * badge en los listados del admin sin necesidad de un join con kyc_validaciones.
     * Se sincroniza desde App\Jobs\ProcesarKycValidacion al terminar cada validación.
     *
     * Sólo ADD COLUMN nullable: no toca ningún dato existente.
     */
    private array $tables = [
        'empleados',
        'proveedor_empleados',
        'productor_empleados',
        'visitas_temporales',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'kyc_estatus')) {
                    $table->string('kyc_estatus', 20)->nullable()->index();
                }
                if (! Schema::hasColumn($tableName, 'kyc_validado_en')) {
                    $table->timestamp('kyc_validado_en')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (! Schema::hasTable($tableName)) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                foreach (['kyc_estatus', 'kyc_validado_en'] as $column) {
                    if (Schema::hasColumn($tableName, $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
