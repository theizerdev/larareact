<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Bitácora de salida (outbox) hacia PeopleSoft Time and Labor.
     *
     * Una fila por marcaje considerado para exportación, con el payload
     * TL_PUNCH_INTFC que se generó y en qué acabó. Sirve para tres cosas:
     *
     *  1. Idempotencia: la clave única (empresa_id, biotime_marcaje_id) impide
     *     mandar dos veces el mismo punch aunque se repita la corrida.
     *  2. Auditoría: ante una discrepancia de nómina se puede demostrar qué se
     *     envió, cuándo y con qué contenido exacto.
     *  3. Reintentos acotados: sólo se reintenta lo que quedó en 'error'.
     *
     * Tabla nueva y aislada: no se toca `biotime_marcajes` ni el cálculo LFT.
     */
    public function up(): void
    {
        Schema::create('peoplesoft_exportaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('biotime_marcaje_id')->nullable()->constrained('biotime_marcajes')->nullOnDelete();

            // Identidad tal como se mandó (se congela: si el mapeo cambia
            // después, el histórico sigue reflejando lo que salió).
            $table->string('emp_code')->nullable();
            $table->string('badge_id', 20)->nullable();
            $table->string('emplid', 11)->nullable();
            $table->unsignedSmallInteger('empl_rcd')->nullable();

            // Contenido del punch en términos de PeopleSoft.
            $table->string('punch_dttm')->nullable();   // ya formateado CCYY-MM-DDTHH:MM:SS.uuuuuu±hhmm
            $table->string('punch_type', 1)->nullable(); // 1 In, 2 Out, 3 Meal, 4 Break, 5 Transfer
            $table->string('tcd_id', 10)->nullable();

            // pendiente | simulado | enviado | error | omitido
            $table->string('estado')->default('pendiente');
            $table->string('motivo')->nullable(); // por qué se omitió o falló

            // Agrupador del mensaje PUNCHED_TIME_ADD en el que viajó.
            $table->uuid('lote_uuid')->nullable();

            $table->json('payload')->nullable();   // fila TL_PUNCH_INTFC generada
            $table->json('respuesta')->nullable(); // acuse del Integration Broker

            $table->timestamp('enviado_at')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_marcaje_id']);
            $table->index('estado');
            $table->index('lote_uuid');
            $table->index(['empresa_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peoplesoft_exportaciones');
    }
};
