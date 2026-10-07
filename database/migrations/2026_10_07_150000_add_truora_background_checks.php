<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Truora (verificación de antecedentes / background check): credenciales por
     * empresa, regla por entidad y el id del check en cada validación.
     * Solo ADD COLUMN, cada una únicamente si falta.
     */
    public function up(): void
    {
        $this->agregar('empresas', 'truora_api_key', fn (Blueprint $t) => $t->text('truora_api_key')->nullable());
        $this->agregar('empresas', 'truora_active', fn (Blueprint $t) => $t->boolean('truora_active')->default(false));
        $this->agregar('empresas', 'truora_score_minimo', fn (Blueprint $t) => $t->decimal('truora_score_minimo', 3, 2)->nullable());
        $this->agregar('validacion_reglas', 'antecedentes_activo', fn (Blueprint $t) => $t->boolean('antecedentes_activo')->default(false));
        $this->agregar('kyc_validaciones', 'truora_check_id', fn (Blueprint $t) => $t->string('truora_check_id', 64)->nullable()->index());
    }

    public function down(): void
    {
        foreach (['empresas' => ['truora_api_key', 'truora_active', 'truora_score_minimo'], 'validacion_reglas' => ['antecedentes_activo'], 'kyc_validaciones' => ['truora_check_id']] as $tabla => $columnas) {
            foreach ($columnas as $columna) {
                if (Schema::hasColumn($tabla, $columna)) {
                    Schema::table($tabla, fn (Blueprint $t) => $t->dropColumn($columna));
                }
            }
        }
    }

    private function agregar(string $tabla, string $columna, \Closure $definicion): void
    {
        if (! Schema::hasColumn($tabla, $columna)) {
            Schema::table($tabla, fn (Blueprint $t) => $definicion($t));
        }
    }
};
