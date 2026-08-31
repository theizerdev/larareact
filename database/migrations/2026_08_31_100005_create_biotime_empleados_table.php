<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Espejo de GET /personnel/api/employees/ (solo lectura). Cada registro
     * guarda además el vínculo suave (empleado_id) hacia el empleado de
     * Shigoto, resuelto automáticamente por documento o a mano desde la UI.
     */
    public function up(): void
    {
        Schema::create('biotime_empleados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $table->unsignedBigInteger('biotime_id');
            $table->string('emp_code');
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('nickname')->nullable();
            $table->string('card_no')->nullable();
            $table->string('dept_code')->nullable();
            $table->string('position_code')->nullable();
            $table->json('area_names')->nullable();
            $table->date('hire_date')->nullable();
            $table->string('gender')->nullable();
            $table->date('birthday')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('national')->nullable(); // documento / identificación nacional
            $table->string('internal_emp_num')->nullable();
            $table->string('payroll_num')->nullable();
            $table->boolean('enable_att')->nullable();

            // Foto sincronizada a disco (storage/app/public/biotime/empleados/).
            $table->string('photo_path')->nullable();
            $table->timestamp('photo_synced_at')->nullable();

            // Vínculo suave con el empleado de Shigoto.
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->nullOnDelete();
            // auto | manual | unmatched
            $table->string('link_status', 20)->default('unmatched');

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'emp_code']);
            $table->unique(['empresa_id', 'biotime_id']);
            $table->index('emp_code');
            $table->index('empleado_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biotime_empleados');
    }
};
