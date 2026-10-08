<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Validaciones rápidas desde el formulario de alta (antes de guardar):
     * RFC de la empresa (TRUORA, antecedentes de empresa) y nombre + CURP de
     * la persona (DIDIT, RENAPO). Al guardar el registro se pasan a
     * kyc_validaciones con su folio.
     *
     * Sólo CREATE TABLE y ADD COLUMN nullable, cada uno únicamente si falta.
     */
    public function up(): void
    {
        if (! Schema::hasTable('prevalidaciones')) {
            Schema::create('prevalidaciones', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('empresa_id')->index();
                $table->unsignedBigInteger('sucursal_id')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('tipo', 10); // rfc | curp
                $table->string('entidad', 30)->nullable();
                $table->string('proveedor', 20); // truora | didit
                $table->string('dato', 20);
                $table->string('nombre')->nullable();
                $table->string('estatus', 20);
                $table->string('referencia', 64)->nullable()->index();
                $table->decimal('score', 5, 2)->nullable();
                $table->json('resultado')->nullable();
                $table->text('observaciones')->nullable();
                $table->text('error_detalle')->nullable();
                $table->unsignedBigInteger('kyc_validacion_id')->nullable()->index();
                $table->timestamp('procesado_en')->nullable();
                $table->timestamps();
                $table->index(['empresa_id', 'tipo', 'dato']);
            });
        }

        if (! Schema::hasColumn('kyc_validaciones', 'alcance')) {
            Schema::table('kyc_validaciones', fn (Blueprint $t) => $t->string('alcance', 20)->nullable());
        }

        if (! Schema::hasColumn('kyc_validaciones', 'dato_consultado')) {
            Schema::table('kyc_validaciones', fn (Blueprint $t) => $t->string('dato_consultado', 20)->nullable());
        }
    }

    public function down(): void
    {
        foreach (['alcance', 'dato_consultado'] as $columna) {
            if (Schema::hasColumn('kyc_validaciones', $columna)) {
                Schema::table('kyc_validaciones', fn (Blueprint $t) => $t->dropColumn($columna));
            }
        }

        Schema::dropIfExists('prevalidaciones');
    }
};
