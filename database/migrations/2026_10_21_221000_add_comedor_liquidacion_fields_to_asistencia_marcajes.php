<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agrega los campos requeridos para la trazabilidad exacta de liquidación
     * a proveedores de comedor por consumo de alimentos en asistencia_marcajes.
     */
    public function up(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->foreignId('opcion_comida_id')
                ->nullable()
                ->after('comida_costo')
                ->constrained('opciones_comida')
                ->nullOnDelete();

            $table->foreignId('proveedor_id')
                ->nullable()
                ->after('opcion_comida_id')
                ->constrained('proveedores')
                ->nullOnDelete();

            $table->decimal('comida_costo_empresa', 10, 2)
                ->nullable()
                ->after('proveedor_id');

            $table->decimal('comida_subsidio', 10, 2)
                ->nullable()
                ->after('comida_costo_empresa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asistencia_marcajes', function (Blueprint $table) {
            $table->dropForeign(['opcion_comida_id']);
            $table->dropForeign(['proveedor_id']);
            $table->dropColumn([
                'opcion_comida_id',
                'proveedor_id',
                'comida_costo_empresa',
                'comida_subsidio',
            ]);
        });
    }
};
