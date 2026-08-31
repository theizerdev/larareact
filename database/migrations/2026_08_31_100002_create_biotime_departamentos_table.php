<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Espejo de GET /personnel/api/departments/ (solo lectura).
     */
    public function up(): void
    {
        Schema::create('biotime_departamentos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->nullable()->constrained('empresas')->nullOnDelete();

            $table->unsignedBigInteger('biotime_id');
            $table->string('dept_code')->nullable();
            $table->string('dept_name')->nullable();
            $table->string('parent_dept_code')->nullable();

            $table->json('raw')->nullable();
            $table->timestamps();

            $table->unique(['empresa_id', 'biotime_id']);
            $table->index(['empresa_id', 'dept_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biotime_departamentos');
    }
};
