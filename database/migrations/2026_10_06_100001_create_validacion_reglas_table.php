<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reglas de validación por empresa y entidad (Integraciones → Validaciones):
     * si se valida identidad, si DIDIT corre como capa antifraude, y qué
     * plantilla ZapSign se manda a firma. Sin renglón = comportamiento de hoy.
     */
    public function up(): void
    {
        Schema::create('validacion_reglas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->index();

            // colaboradores | visitas | proveedores | socios
            $table->string('entidad', 30);

            $table->boolean('kyc_activo')->default(true);
            $table->boolean('didit_antifraude')->default(false);

            $table->boolean('firma_activa')->default(false);
            $table->string('plantilla_zapsign', 64)->nullable();
            $table->string('nombre_documento')->nullable();
            $table->boolean('firma_obligatoria')->default(false);

            // ZapSign valida además la INE o el pasaporte del firmante (biometría;
            // cobro aparte de ZapSign por validación).
            $table->boolean('firma_valida_identidad')->default(false);

            $table->timestamps();

            $table->unique(['empresa_id', 'entidad']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('validacion_reglas');
    }
};
