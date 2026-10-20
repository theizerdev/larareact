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
        if (!Schema::hasTable('empleados')) {
            Schema::create('empleados', function (Blueprint $table) {
                $table->id();
                $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
                $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

                // Datos personales
                $table->string('nombres', 100);
                $table->string('apellidos', 100);
                $table->string('documento_tipo', 30)->default('DNI/CI');
                $table->string('documento_numero', 50)->nullable()->index();
                $table->string('email', 150)->nullable();
                $table->string('telefono', 50)->nullable();
                $table->string('direccion', 255)->nullable();

                // Datos laborales y comisiones
                $table->string('cargo', 100)->nullable();
                $table->decimal('sueldo_base', 12, 2)->default(0.00);
                $table->decimal('porcentaje_comision', 5, 2)->default(0.00); // Ej: 5.00 para 5%
                $table->enum('tipo_comision', ['porcentaje', 'monto_fijo'])->default('porcentaje');
                $table->enum('comision_aplica_a', ['subtotal', 'total'])->default('subtotal');
                $table->boolean('estado')->default(true)->index(); // true = activo, false = inactivo
                $table->date('fecha_ingreso')->nullable();
                $table->text('notas')->nullable();

                $table->timestamps();

                $table->index(['empresa_id', 'sucursal_id', 'estado']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empleados');
    }
};
