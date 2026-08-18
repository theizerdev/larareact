<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabla de Horarios de Atención del Médico por Día de la Semana
        Schema::create('medico_horarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->tinyInteger('dia_semana'); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
            $table->time('hora_inicio')->default('08:00:00');
            $table->time('hora_fin')->default('17:00:00');
            $table->time('hora_inicio_almuerzo')->nullable()->default('13:00:00');
            $table->time('hora_fin_almuerzo')->nullable()->default('14:00:00');
            $table->integer('buffer_minutos')->default(10);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['medico_id', 'dia_semana']);
        });

        // 2. Tabla de Bloqueos de Agenda (Almuerzos, Reuniones, Vacaciones, Feriados)
        Schema::create('citas_bloqueos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('medico_id')->nullable()->constrained('medicos')->onDelete('cascade');
            $table->string('titulo');
            $table->dateTime('fecha_hora_inicio');
            $table->dateTime('fecha_hora_fin');
            $table->text('motivo')->nullable();
            $table->timestamps();
        });

        // 3. Tabla Principal de Citas Médicas
        Schema::create('citas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');

            // Código Correlativo de Cita (ej. CIT-2026-0001)
            $table->string('codigo_cita');

            // Relaciones principales
            $table->foreignId('paciente_id')->constrained('pacientes')->onDelete('cascade');
            $table->foreignId('medico_id')->constrained('medicos')->onDelete('cascade');
            $table->foreignId('especialidad_id')->nullable()->constrained('especialidades')->onDelete('set null');
            $table->foreignId('tipo_atencion_id')->nullable()->constrained('tipos_atencion')->onDelete('set null');

            // Tiempos y Duración
            $table->dateTime('fecha_hora_inicio');
            $table->dateTime('fecha_hora_fin');
            $table->integer('duracion_minutos')->default(30);
            $table->integer('buffer_descanso_minutos')->default(10);

            // Estado Actual de la Cita (Código de colores)
            // pendiente (Amarillo), confirmada_pagada (Verde), en_sala_espera (Azul), en_consulta (Morado), atendida (Naranja), cancelada (Rojo), no_asistio (Gris), bloqueado (Gris)
            $table->enum('estado', [
                'pendiente',
                'confirmada_pagada',
                'en_sala_espera',
                'en_consulta',
                'atendida',
                'cancelada',
                'no_asistio',
                'bloqueado'
            ])->default('pendiente');

            // Detalles Médicos & Recepción
            $table->text('motivo_consulta')->nullable();
            $table->text('notas_recepcion')->nullable();
            $table->string('link_virtual')->nullable(); // Enlace para Telemedicina

            // Pagos & Finanzas
            $table->decimal('monto_estimado', 10, 2)->default(0.00);
            $table->decimal('monto_pagado', 10, 2)->default(0.00);
            $table->enum('estado_pago', ['pendiente', 'parcial', 'pagado', 'reembolsado'])->default('pendiente');

            // Fechas de Auditoría de Flujo Clínico
            $table->dateTime('fecha_confirmacion')->nullable();
            $table->dateTime('fecha_llegada_sala_espera')->nullable();
            $table->dateTime('fecha_inicio_consulta')->nullable();
            $table->dateTime('fecha_fin_consulta')->nullable();

            // Cancelaciones
            $table->text('motivo_cancelacion')->nullable();
            $table->foreignId('cancelado_por_user_id')->nullable()->constrained('users')->onDelete('set null');

            // Notificaciones WhatsApp
            $table->boolean('recordatorio_whatsapp_enviado')->default(false);
            $table->dateTime('fecha_envio_recordatorio')->nullable();

            // Auditoría
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['empresa_id', 'codigo_cita']);
            $table->index(['empresa_id', 'fecha_hora_inicio', 'fecha_hora_fin']);
            $table->index(['medico_id', 'fecha_hora_inicio', 'fecha_hora_fin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citas');
        Schema::dropIfExists('citas_bloqueos');
        Schema::dropIfExists('medico_horarios');
    }
};
