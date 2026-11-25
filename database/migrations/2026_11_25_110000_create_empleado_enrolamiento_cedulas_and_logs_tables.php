<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empleado_enrolamiento_cedulas', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('origen', 30)->default('kiosko'); // kiosko, admin, publico
            $table->string('estado', 30)->default('en_proceso'); // en_proceso, completado, rechazado
            $table->string('no_empleado', 80)->nullable();
            $table->string('codigo_legacy', 80)->nullable();
            $table->string('nombre_completo');
            $table->string('area_departamento')->nullable();
            $table->string('puesto_cargo')->nullable();
            $table->string('correo')->nullable();
            $table->timestamp('aviso_privacidad_aceptado_en')->nullable();
            $table->timestamp('enrolado_en')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->string('foto_1_path')->nullable();
            $table->string('foto_2_path')->nullable();
            $table->string('foto_1_hash', 64)->nullable();
            $table->string('foto_2_hash', 64)->nullable();
            $table->string('sello_digital', 64)->nullable()->index();
            $table->json('sello_payload')->nullable();
            $table->string('pdf_path')->nullable();
            $table->timestamps();

            $table->index(['empleado_id', 'estado']);
        });

        Schema::create('empleado_enrolamiento_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('cedula_id')->nullable()->constrained('empleado_enrolamiento_cedulas')->cascadeOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->cascadeOnDelete();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('accion', 60)->index(); // aviso_privacidad, enrolamiento
            $table->string('etiqueta', 120); // Aviso de Privacidad, Enrolamiento
            $table->text('descripcion')->nullable();
            $table->string('origen', 30)->default('kiosko');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->json('metadata')->nullable();
            $table->string('hash_evento', 64)->index();
            $table->timestamp('ocurrido_en');
            $table->timestamps();

            $table->index(['empleado_id', 'accion']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empleado_enrolamiento_logs');
        Schema::dropIfExists('empleado_enrolamiento_cedulas');
    }
};
