<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cierres_mensuales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            $table->integer('year')->index();
            $table->integer('month')->index();
            $table->timestamp('fecha_cierre')->useCurrent();

            $table->decimal('total_ingresos', 14, 2)->default(0);
            $table->decimal('total_egresos', 14, 2)->default(0);
            $table->decimal('saldo_neto', 14, 2)->default(0);

            $table->decimal('fondo_siguiente_mes', 14, 2)->default(0);
            $table->decimal('retiro_utilidad', 14, 2)->default(0);

            $table->enum('status', ['abierto', 'cerrado'])->default('cerrado');
            $table->text('notas')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cierres_mensuales');
    }
};
