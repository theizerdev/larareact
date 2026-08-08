<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('apuntes_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asiento_id')->constrained('asientos_contables')->onDelete('cascade');
            $table->foreignId('cuenta_id')->constrained('cuentas_contables')->onDelete('cascade');
            $table->nullableMorphs('tercero');
            $table->decimal('debe', 15, 2)->default(0.00);
            $table->decimal('haber', 15, 2)->default(0.00);
            $table->decimal('debe_usd', 15, 2)->default(0.00);
            $table->decimal('haber_usd', 15, 2)->default(0.00);
            $table->string('referencia')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apuntes_contables');
    }
};
