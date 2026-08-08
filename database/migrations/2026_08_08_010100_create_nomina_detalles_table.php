<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nomina_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_id')->constrained('nominas')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');

            $table->string('rol_nombre')->nullable();
            $table->decimal('sueldo_base_snapshot', 14, 2)->default(0);
            $table->decimal('bonos', 14, 2)->default(0);
            $table->decimal('descuentos', 14, 2)->default(0);
            $table->decimal('total_neto', 14, 2)->default(0);

            $table->enum('estado_pago', ['pendiente', 'pagado'])->default('pendiente');
            $table->timestamp('fecha_pago')->nullable();
            $table->text('observaciones')->nullable();

            $table->timestamps();

            $table->unique(['nomina_id', 'user_id']);
            $table->index(['estado_pago', 'nomina_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nomina_detalles');
    }
};
