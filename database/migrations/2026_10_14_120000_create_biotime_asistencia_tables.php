<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Espejo de solo lectura del módulo de asistencia de BioTime (/att/api/):
 * horarios, turnos, calendarios y permisos/incidencias.
 *
 * Igual que el resto de tablas biotime_*: no alimentan turnos_laborales ni el
 * cálculo LFT. biotime_id es cadena porque BioTime Cloud usa UUID donde el
 * BioTime local usa enteros.
 */
return new class extends Migration
{
    public function up(): void
    {
        // GET /att/api/timeintervals/ — horario (duración de la jornada).
        Schema::create('biotime_horarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->string('biotime_id', 64);

            $table->string('alias')->nullable();
            $table->string('use_mode')->nullable();
            $table->string('in_time', 8)->nullable();
            $table->string('out_time', 8)->nullable();
            $table->unsignedInteger('duration')->nullable();           // minutos
            $table->unsignedInteger('work_time_duration')->nullable(); // minutos
            $table->unsignedInteger('break_time_duration')->nullable(); // minutos
            $table->boolean('cross_day')->default(false);
            $table->boolean('in_required')->nullable();
            $table->boolean('out_required')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
        });

        // GET /att/api/attshifts/ — turno (horarios asignados a la semana).
        Schema::create('biotime_turnos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->string('biotime_id', 64);

            $table->string('alias')->nullable();
            // BioTime lo manda como alias de horarios separados por coma.
            $table->text('shift_timetable')->nullable();
            $table->string('cycle_unit')->nullable();
            $table->unsignedInteger('shift_cycle')->nullable();
            $table->boolean('auto_shift')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
        });

        // GET /att/api/attschedules/ — calendario: qué turno tiene cada
        // empleado y en qué rango de fechas.
        Schema::create('biotime_calendarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->string('biotime_id', 64);

            // IDs internos de BioTime tal cual llegan (empleado y turno).
            $table->string('employee_biotime_id', 64)->nullable();
            $table->string('shift_biotime_id', 64)->nullable();

            $table->foreignId('biotime_empleado_id')->nullable()->constrained('biotime_empleados')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();
            $table->foreignId('biotime_turno_id')->nullable()->constrained('biotime_turnos')->nullOnDelete();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index('employee_biotime_id');
        });

        // GET /att/api/leaves/ — permisos e incidencias.
        Schema::create('biotime_permisos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->string('biotime_id', 64);

            $table->string('emp_code')->nullable();
            $table->foreignId('biotime_empleado_id')->nullable()->constrained('biotime_empleados')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('dept_name')->nullable();

            $table->string('category')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->text('apply_reason')->nullable();
            $table->dateTime('apply_time')->nullable();
            $table->string('audit_status')->nullable();
            $table->text('audit_reason')->nullable();
            $table->dateTime('audit_time')->nullable();
            $table->string('last_approver')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index('emp_code');
            $table->index(['empresa_id', 'start_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biotime_permisos');
        Schema::dropIfExists('biotime_calendarios');
        Schema::dropIfExists('biotime_turnos');
        Schema::dropIfExists('biotime_horarios');
    }
};
