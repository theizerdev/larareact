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
        Schema::create('empleado_vehiculos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
            $table->string('tipo_vehiculo');
            $table->string('marca');
            $table->string('modelo');
            $table->integer('year');
            $table->string('placa');
            $table->string('foto_frontal')->nullable();
            $table->string('foto_trasera')->nullable();
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
        Schema::dropIfExists('empleado_vehiculos');
    }
};
