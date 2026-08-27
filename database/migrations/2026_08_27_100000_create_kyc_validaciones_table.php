<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Historial de validaciones de identidad (KYC) ejecutadas contra JAAK.
     *
     * Tabla polimórfica: una persona pre-registrada (Empleado, ProveedorEmpleado,
     * ProductorEmpleado o VisitaTemporal) puede tener varias validaciones a lo largo
     * del tiempo (p. ej. si un admin la manda a revalidar). El estatus "vigente" se
     * denormaliza en la propia tabla de la persona (columna kyc_estatus) para poder
     * pintar el badge en los listados sin un join.
     */
    public function up(): void
    {
        Schema::create('kyc_validaciones', function (Blueprint $table) {
            $table->id();

            // Persona validada
            $table->string('validable_type');
            $table->unsignedBigInteger('validable_id');
            $table->index(['validable_type', 'validable_id']);

            // Scoping multitenant (mismo patrón que el resto de entidades). Nullable
            // porque el pre-registro es una ruta pública sin usuario autenticado; el
            // controlador rellena estos valores desde el propio pre-registro.
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();

            // Entrada del usuario y referencia a la sesión JAAK
            $table->string('curp_capturada', 18)->nullable();
            $table->string('jaak_environment', 20)->default('sandbox');
            $table->string('jaak_session_id')->nullable();
            $table->string('jaak_short_key', 32)->nullable();

            // pendiente | procesando | aprobado | revision | rechazado | error
            $table->string('estatus', 20)->default('pendiente')->index();

            // Flags rápidos para filtros / badges (nullable = no se pudo determinar)
            $table->boolean('curp_valida')->nullable();
            $table->boolean('ine_valida')->nullable();
            $table->boolean('rostro_coincide')->nullable();
            $table->boolean('en_listas')->nullable();
            $table->decimal('score_global', 5, 2)->nullable();

            // Respuestas crudas de JAAK por paso (para auditoría / depuración)
            $table->json('resultado_documento')->nullable();
            $table->json('resultado_ocr')->nullable();
            $table->json('resultado_listas')->nullable();
            $table->json('resultado_biometrico')->nullable();

            $table->text('observaciones')->nullable();
            $table->text('error_detalle')->nullable();
            $table->timestamp('procesado_en')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kyc_validaciones');
    }
};
