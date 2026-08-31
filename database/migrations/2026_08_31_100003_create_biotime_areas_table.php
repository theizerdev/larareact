<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Espejo de GET /personnel/api/areas/ (solo lectura).
     */
    public function up(): void
    {
        Schema::create('biotime_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $table->unsignedBigInteger('biotime_id');
            $table->string('area_code')->nullable();
            $table->string('area_name')->nullable();
            $table->string('parent_area_code')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index(['empresa_id', 'area_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biotime_areas');
    }
};
