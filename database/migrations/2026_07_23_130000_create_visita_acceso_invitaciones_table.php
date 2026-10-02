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
        Schema::create('visita_acceso_invitaciones', function (Blueprint $table) {
            $table->id();
            $table->char('uuid', 36)->unique();
            $table->string('codigo_invitacion', 50)->unique();
            $table->enum('tipo_acceso', ['empleado', 'proveedor', 'productor', 'visitante'])->default('visitante');
            
            $table->foreignId('anfitrion_id')->nullable()->constrained('responsables')->onDelete('set null');
            $table->foreignId('anfitrion_user_id')->nullable()->constrained('users')->onDelete('set null');

            $table->string('visitante_nombre');
            $table->string('visitante_nombres')->nullable();
            $table->string('visitante_apellidos')->nullable();
            $table->string('visitante_documento', 50)->nullable();
            $table->foreignId('pais_telefono_id')->nullable()->constrained('pais')->onDelete('set null');
            $table->string('visitante_telefono', 50)->nullable();
            $table->string('visitante_empresa')->nullable();
            $table->foreignId('tipo_servicio_id')->nullable()->constrained('tipo_servicios')->onDelete('set null');

            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->onDelete('set null');
            $table->foreignId('proveedor_id')->nullable()->constrained('proveedores')->onDelete('set null');
            $table->foreignId('proveedor_empleado_id')->nullable()->constrained('proveedor_empleados')->onDelete('set null');
            $table->foreignId('productor_id')->nullable()->constrained('productores')->onDelete('set null');
            $table->foreignId('productor_empleado_id')->nullable()->constrained('productor_empleados')->onDelete('set null');

            $table->date('fecha_estimada');
            $table->time('hora_estimada')->nullable();
            $table->enum('medio_acceso', ['peatonal', 'vehicular'])->default('peatonal');
            $table->string('vehiculo_placa', 50)->nullable();
            $table->string('vehiculo_marca', 100)->nullable();
            $table->string('vehiculo_modelo', 100)->nullable();

            $table->text('motivo_visita')->nullable();
            $table->enum('status', ['pendiente', 'ingresado', 'cancelado', 'expirado'])->default('pendiente');

            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('cascade');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visita_acceso_invitaciones');
    }
};
