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
        Schema::create('visitas_accesos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('codigo_visitante')->unique();
            $table->enum('tipo_acceso', ['empleado', 'proveedor']);
            
            // Empleado
            $table->foreignId('empleado_id')->nullable()->constrained('empleados')->onDelete('cascade');
            
            // Proveedor y Empleado del Proveedor
            $table->foreignId('proveedor_id')->nullable()->constrained('proveedores')->onDelete('cascade');
            $table->foreignId('proveedor_empleado_id')->nullable()->constrained('proveedor_empleados')->onDelete('set null');
            
            // Medio de Acceso: peatonal o vehicular
            $table->enum('medio_acceso', ['peatonal', 'vehicular'])->default('peatonal');
            
            // Vehículos registrados
            $table->foreignId('empleado_vehiculo_id')->nullable()->constrained('empleado_vehiculos')->onDelete('set null');
            $table->foreignId('proveedor_vehiculo_id')->nullable()->constrained('proveedor_vehiculos')->onDelete('set null');
            
            // Datos de vehículo ad-hoc si no está pre-registrado
            $table->string('vehiculo_tipo')->nullable();
            $table->string('vehiculo_marca')->nullable();
            $table->string('vehiculo_modelo')->nullable();
            $table->string('vehiculo_placa')->nullable();
            $table->text('vehiculo_foto_frontal')->nullable();
            $table->text('vehiculo_foto_trasera')->nullable();
            
            // Fechas y horas de acceso
            $table->date('fecha_ingreso');
            $table->time('hora_ingreso');
            $table->date('fecha_salida')->nullable();
            $table->time('hora_salida')->nullable();
            
            // Relaciones de empresa y sucursal
            $table->foreignId('responsable_id')->nullable()->constrained('responsables')->onDelete('set null');
            $table->text('observaciones')->nullable();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->constrained('sucursales')->onDelete('cascade');
            
            // Estado: 1 = En Instalaciones, 2 = Finalizado, 3 = Cancelado
            $table->smallInteger('status')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitas_accesos');
    }
};
