<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Foto del socio comercial (su responsable) y datos de identidad para las
     * validaciones (JaaK / Didit / ZapSign): documento por ambos lados, correo
     * del firmante y el estatus KYC denormalizado, igual que las demás personas.
     * Solo ADD COLUMN nullable: no toca datos existentes.
     */
    public function up(): void
    {
        Schema::table('productores', function (Blueprint $table) {
            $table->string('foto')->nullable();
            $table->string('documento_frontal')->nullable();
            $table->string('documento_reverso')->nullable();
            $table->string('correo')->nullable();
            $table->string('kyc_estatus', 20)->nullable()->index();
            $table->timestamp('kyc_validado_en')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('productores', function (Blueprint $table) {
            $table->dropColumn(['foto', 'documento_frontal', 'documento_reverso', 'correo', 'kyc_estatus', 'kyc_validado_en']);
        });
    }
};
