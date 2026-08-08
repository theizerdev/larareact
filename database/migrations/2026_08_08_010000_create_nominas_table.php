<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nominas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');

            $table->unsignedSmallInteger('year')->index();
            $table->unsignedTinyInteger('month')->index();

            $table->enum('estado', ['borrador', 'cerrada', 'pagada'])->default('borrador')->index();

            $table->decimal('total_bruto', 14, 2)->default(0);
            $table->decimal('total_bonos', 14, 2)->default(0);
            $table->decimal('total_descuentos', 14, 2)->default(0);
            $table->decimal('total_neto', 14, 2)->default(0);

            $table->timestamp('fecha_cierre')->nullable();
            $table->text('notas')->nullable();

            $table->timestamps();

            $table->index(['empresa_id', 'sucursal_id', 'year', 'month'], 'nominas_scope_periodo_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nominas');
    }
};
