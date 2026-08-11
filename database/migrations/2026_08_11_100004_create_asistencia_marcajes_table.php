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
        Schema::create('asistencia_marcajes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->foreignId('empleado_id')->constrained('empleados')->onDelete('cascade');
            $table->string('tipo_marcaje'); // entrada, salida_comida, entrada_comida, salida
            $table->dateTime('fecha_hora');
            $table->string('origen')->default('kiosko'); // kiosko, manual, tarjeta, app
            $table->string('fotografia_path')->nullable();
            $table->decimal('latitud', 10, 7)->nullable();
            $table->decimal('longitud', 10, 7)->nullable();
            $table->string('dispositivo_id')->nullable();
            $table->string('observaciones')->nullable();
            $table->foreignId('registrado_por_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asistencia_marcajes');
    }
};
