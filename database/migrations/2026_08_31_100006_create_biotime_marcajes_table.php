<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Espejo de GET /iclock/api/transactions/ (marcajes / punches). SOLO
     * LECTURA y COMPLETAMENTE SEPARADO de asistencia_marcajes: no alimenta el
     * cálculo LFT ni dispara notificaciones. La clave (empresa_id, biotime_id)
     * hace que el sync sea idempotente.
     */
    public function up(): void
    {
        Schema::create('biotime_marcajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $table->unsignedBigInteger('biotime_id'); // transaction id en BioTime
            $table->string('emp_code');
            $table->foreignId('biotime_empleado_id')->nullable()->constrained('biotime_empleados')->nullOnDelete();
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();

            $table->string('dispositivo_sn')->nullable();
            $table->string('dispositivo_alias')->nullable();
            $table->string('area_alias')->nullable();

            $table->dateTime('punch_time');
            $table->string('punch_state')->nullable();       // "0".."5" tal cual lo da BioTime
            $table->string('punch_state_label')->nullable(); // etiqueta legible resuelta en el sync
            $table->integer('verify_type')->nullable();
            $table->string('verify_type_label')->nullable();
            $table->string('work_code')->nullable();

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('gps_location')->nullable();
            $table->decimal('temperature', 5, 2)->nullable();
            $table->integer('is_mask')->nullable();
            $table->integer('source')->nullable();
            $table->dateTime('upload_time')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index('emp_code');
            $table->index('punch_time');
            $table->index(['empresa_id', 'punch_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biotime_marcajes');
    }
};
