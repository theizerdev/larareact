<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Puente de identidad entre el empleado de Shigoto/ZKTeco y el time
     * reporter de PeopleSoft.
     *
     * PeopleSoft identifica a quien marca por BADGE_ID (Char 20) o por la
     * pareja EMPLID (Char 11) + EMPL_RCD, mientras que el reloj SpeedFace sólo
     * manda su `emp_code`. Casi nunca coinciden, así que la equivalencia se
     * guarda explícitamente en vez de asumirse.
     *
     * Tabla nueva y aislada: no se toca `empleados` ni `biotime_empleados`.
     */
    public function up(): void
    {
        Schema::create('peoplesoft_empleado_mapeos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            // Lado Shigoto / ZKTeco.
            $table->string('emp_code');
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();

            // Lado PeopleSoft (longitudes exactas del layout TL_PUNCH_INTFC).
            $table->string('badge_id', 20)->nullable();
            $table->string('emplid', 11)->nullable();
            $table->unsignedSmallInteger('empl_rcd')->default(0);

            // Permite excluir a alguien del envío sin borrar su equivalencia.
            $table->boolean('activo')->default(true);
            $table->text('notas')->nullable();

            $table->timestamps();

            // Un emp_code de reloj sólo puede apuntar a un time reporter.
            $table->unique(['empresa_id', 'emp_code']);
            $table->index('badge_id');
            $table->index('emplid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('peoplesoft_empleado_mapeos');
    }
};
