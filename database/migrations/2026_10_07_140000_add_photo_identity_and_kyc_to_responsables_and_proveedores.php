<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Foto y documento de identidad para poder validar (botón "Validar") a los
     * responsables y a los proveedores (su representante / persona física).
     * Solo ADD COLUMN nullable: no toca datos existentes.
     */
    public function up(): void
    {
        Schema::table('responsables', function (Blueprint $table) {
            $table->string('curp', 18)->nullable();
            $this->evidencia($table);
        });

        Schema::table('proveedores', function (Blueprint $table) {
            $table->string('correo')->nullable();
            $this->evidencia($table);
        });
    }

    public function down(): void
    {
        foreach (['responsables' => ['curp'], 'proveedores' => ['correo']] as $tabla => $propias) {
            Schema::table($tabla, function (Blueprint $table) use ($propias) {
                $table->dropColumn(array_merge($propias, ['foto', 'documento_frontal', 'documento_reverso', 'tipo_documento', 'kyc_estatus', 'kyc_validado_en']));
            });
        }
    }

    private function evidencia(Blueprint $table): void
    {
        $table->string('foto')->nullable();
        $table->string('documento_frontal')->nullable();
        $table->string('documento_reverso')->nullable();
        $table->string('tipo_documento', 20)->nullable();
        $table->string('kyc_estatus', 20)->nullable()->index();
        $table->timestamp('kyc_validado_en')->nullable();
    }
};
