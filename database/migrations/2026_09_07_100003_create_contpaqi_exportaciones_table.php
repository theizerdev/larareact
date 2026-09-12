<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bitácora de exportaciones a CONTPAQi y el detalle de cada renglón.
     *
     * Una exportación es un archivo: un período de nómina de una empresa,
     * congelado. Se guarda el resultado completo, no sólo el archivo, porque
     * cuando dentro de dos meses alguien reclame que le faltaron horas extra
     * la pregunta va a ser "que mandamos exactamente y de donde salió", y
     * regenerar el cálculo con los datos de hoy no responde eso.
     *
     * Mismo criterio que peoplesoft_exportaciones: el detalle guarda también
     * lo que NO se exportó y por qué, que suele ser lo más útil de todo.
     */
    public function up(): void
    {
        Schema::create('contpaqi_exportaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->uuid('lote_uuid')->unique();

            // Período de nómina cubierto, inclusivo en ambos extremos.
            $table->date('periodo_inicio');
            $table->date('periodo_fin');

            // Número de período de CONTPAQi, si se conoce (el "15" de
            // "15 - Semanal del lunes 6 de abril..."). Opcional: sirve para
            // cotejar contra la pantalla de CONTPAQi al momento de importar.
            $table->unsignedSmallInteger('numero_periodo')->nullable();

            $table->enum('estado', ['generando', 'generada', 'descargada', 'error'])
                ->default('generando');

            // Ruta del .xlsx dentro del disco configurado, y su nombre visible.
            $table->string('disco', 30)->nullable();
            $table->string('ruta_archivo')->nullable();
            $table->string('nombre_archivo')->nullable();

            // Totales del lote. Redundantes con el detalle a propósito: la
            // pantalla de listado no debería agregar miles de renglones para
            // enseñar un resumen.
            $table->unsignedInteger('empleados_exportados')->default(0);
            $table->unsignedInteger('empleados_omitidos')->default(0);
            $table->unsignedInteger('renglones_generados')->default(0);

            // Mnemónicos que efectivamente salieron en el archivo, en orden de
            // columna. Es la forma de saber cómo estaba armado el archivo sin
            // tener que abrirlo.
            $table->json('columnas')->nullable();
            $table->text('mensaje_error')->nullable();

            $table->foreignId('generado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generada_at')->nullable();

            $table->timestamps();

            // Nombre explícito: el que genera Laravel por convención rebasa el
            // límite de 64 caracteres para identificadores de MySQL.
            $table->index(['empresa_id', 'periodo_inicio', 'periodo_fin'], 'contpaqi_export_empresa_periodo_idx');
        });

        Schema::create('contpaqi_exportacion_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('contpaqi_exportacion_id')->constrained('contpaqi_exportaciones')->cascadeOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();

            // Se copia el código en vez de sólo referenciar el mapeo: si
            // mañana alguien corrige el mapeo, este renglón debe seguir
            // diciendo qué código se mandó ese día.
            $table->string('codigo_empleado', 30)->nullable();
            $table->string('nombre_empleado')->nullable();

            $table->enum('estado', ['exportado', 'omitido'])->default('exportado');

            // Por qué se omitió: sin mapeo, mapeo inactivo, sin movimientos en
            // el período. Nulo cuando sí se exportó.
            $table->string('motivo')->nullable();

            // Los valores por mnemónico tal como se escribieron en el archivo:
            // {"TRAB": 6, "HE1": 4.5, "RET": 0.25}. Es la evidencia de lo que
            // se entregó.
            $table->json('valores')->nullable();

            $table->timestamps();

            // Igual que arriba: nombre explícito por el límite de MySQL.
            $table->index(['contpaqi_exportacion_id', 'estado'], 'contpaqi_export_det_estado_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contpaqi_exportacion_detalles');
        Schema::dropIfExists('contpaqi_exportaciones');
    }
};
