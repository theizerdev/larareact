<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Folio de operación: amarra un alta / pre-registro con su validación de
     * identidad (JAAK) y sus documentos a firma (ZapSign), para darle
     * seguimiento en el menú "Resultados de validaciones".
     *
     * Formato del folio: PREFIJO-AAAAMMDD-NNNN (p. ej. COL-20261002-0042), con
     * consecutivo por empresa, prefijo y día. Tabla nueva: no toca datos existentes.
     */
    public function up(): void
    {
        Schema::create('operaciones_validacion', function (Blueprint $table) {
            $table->id();

            $table->string('folio', 32);

            // alta | prerregistro | revalidacion
            $table->string('tipo_operacion', 20)->default('alta');

            // Entidad titular del folio (Empleado, Proveedor, Productor, VisitaTemporal, ...)
            $table->string('entidad_type')->nullable();
            $table->unsignedBigInteger('entidad_id')->nullable();
            $table->index(['entidad_type', 'entidad_id']);

            // Scoping multitenant. Nullable porque el pre-registro es una ruta
            // pública; se rellena desde la propia entidad.
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();

            // panel | prerregistro | telefono
            $table->string('origen', 20)->default('panel');
            $table->unsignedBigInteger('iniciado_por')->nullable();

            // en_curso | completo | con_observaciones | rechazado
            $table->string('estatus', 20)->default('en_curso')->index();

            $table->timestamps();

            $table->unique(['empresa_id', 'folio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operaciones_validacion');
    }
};
