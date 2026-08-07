<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('orden_reparacion_fotos')) {
            Schema::create('orden_reparacion_fotos', function (Blueprint $table) {
                $table->id();
                $table->foreignId('orden_id')->constrained('ordenes_reparacion')->onDelete('cascade');
                $table->string('angulo')->default('frente');
                $table->longText('url');
                $table->string('descripcion')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('orden_reparacion_fotos');
    }
};
