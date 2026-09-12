<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Incidencias capturadas a mano: vacaciones, permisos, incapacidades,
     * días de castigo.
     *
     * Es la mitad que faltaba. La asistencia sabe derivar días trabajados,
     * horas extra, retardos y faltas, pero no puede saber que alguien está de
     * vacaciones o incapacitado: eso lo sabe Recursos Humanos y hasta ahora se
     * capturaba directo en CONTPAQi, fuera de Shigoto. Sin esta tabla la
     * prenómina exportada saldría incompleta y, peor, marcaría como falta
     * injustificada a alguien que tenía permiso.
     *
     * Por eso la derivación de faltas consulta esta tabla antes de marcar
     * FINJ: una fecha cubierta por una incidencia aprobada nunca es falta.
     */
    public function up(): void
    {
        Schema::create('incidencias_empleado', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('contpaqi_tipo_incidencia_id')->constrained('contpaqi_tipos_incidencia')->cascadeOnDelete();

            // Rango cerrado, inclusivo en ambos extremos. Una incidencia de un
            // solo día lleva inicio == fin.
            $table->date('fecha_inicio');
            $table->date('fecha_fin');

            /*
             * Cantidad en la unidad del tipo (días u horas). Se guarda
             * explícita en vez de derivarla del rango porque no siempre
             * coinciden: un permiso puede ser de medio día, y una incapacidad
             * de 3 días naturales puede cubrir sólo 2 laborables según el
             * turno. Quien captura decide; el sistema propone.
             */
            $table->decimal('cantidad', 8, 2);

            /*
             * Ciclo de vida. Sólo 'aprobada' entra a la exportación y sólo
             * 'aprobada' bloquea la derivación de una falta: un permiso que
             * nadie autorizó no debe tapar una ausencia real.
             *
             * 'aplicada' es el estado terminal, lo pone la exportación cuando
             * la incidencia ya viajó en un archivo. Evita mandar dos veces las
             * mismas vacaciones si se regenera un período.
             */
            $table->enum('estado', ['borrador', 'pendiente', 'aprobada', 'rechazada', 'aplicada'])
                ->default('pendiente');

            // Folio del documento que respalda la incidencia: el número de
            // incapacidad del IMSS, el oficio del permiso. Es lo primero que
            // pide una auditoría.
            $table->string('folio', 60)->nullable();
            $table->text('motivo')->nullable();
            $table->string('documento')->nullable();

            $table->foreignId('capturado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('aprobado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('aprobado_at')->nullable();

            $table->timestamps();

            // La consulta caliente es "que incidencias cubren a este empleado
            // en este rango", que corre una vez por empleado en cada
            // exportación y en cada derivación de faltas.
            $table->index(['empleado_id', 'fecha_inicio', 'fecha_fin']);
            $table->index(['empresa_id', 'estado']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidencias_empleado');
    }
};
