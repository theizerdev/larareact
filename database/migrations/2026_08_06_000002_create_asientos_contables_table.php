<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asientos_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->onDelete('set null');
            $table->string('numero_asiento')->index();
            $table->dateTime('fecha');
            $table->string('glosa');
            $table->nullableMorphs('origen');
            $table->decimal('tasa_cambio', 12, 4)->default(1.0000);
            $table->enum('estado', ['borrador', 'contabilizado', 'anulado'])->default('contabilizado');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asientos_contables');
    }
};
