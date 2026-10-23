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
        Schema::create('reloj_ubicaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->integer('numero_localidad')->nullable()->index();
            $table->string('planta');
            $table->text('direccion')->nullable();
            $table->string('estado', 120)->nullable()->index();
            $table->string('ciudad', 120)->nullable();
            $table->string('legacy', 60)->nullable()->index();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'numero_localidad']);
            $table->index(['empresa_id', 'planta']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reloj_ubicaciones');
    }
};

