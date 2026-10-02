<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Documentos enviados a firma electrónica con ZapSign dentro de un folio de
     * operación. El estatus se actualiza por webhook de ZapSign o consultando
     * el documento. Tabla nueva: no toca datos existentes.
     */
    public function up(): void
    {
        Schema::create('firma_documentos', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('operacion_id')->nullable()->index();

            // Registro al que pertenece el documento (Empleado, Proveedor, ...)
            $table->string('firmable_type')->nullable();
            $table->unsignedBigInteger('firmable_id')->nullable();
            $table->index(['firmable_type', 'firmable_id']);

            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();

            // Referencias de ZapSign
            $table->string('zapsign_environment', 20)->default('production');
            $table->string('zapsign_plantilla_token')->nullable();
            $table->string('zapsign_doc_token')->nullable()->index();
            $table->string('zapsign_signer_token')->nullable()->index();
            $table->text('sign_url')->nullable();

            $table->string('nombre_documento');
            $table->string('firmante_nombre');
            $table->string('firmante_email')->nullable();
            $table->string('firmante_telefono', 30)->nullable();

            // pendiente | firmado | rechazado | cancelado | error
            $table->string('estatus', 20)->default('pendiente')->index();

            $table->timestamp('enviado_en')->nullable();
            $table->timestamp('firmado_en')->nullable();
            $table->timestamp('rechazado_en')->nullable();

            // PDF firmado copiado al volumen privado (disco local)
            $table->string('pdf_firmado_path')->nullable();

            $table->json('respuesta')->nullable();
            $table->text('error_detalle')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('firma_documentos');
    }
};
