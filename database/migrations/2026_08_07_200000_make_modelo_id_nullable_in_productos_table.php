<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Makes modelo_id nullable in productos table to support repuesto products
     * that don't belong to a specific device model.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Drop the existing foreign key constraint first
            $table->dropForeign(['modelo_id']);

            // Make modelo_id nullable
            $table->foreignId('modelo_id')->nullable()->change();

            // Re-add foreign key with nullable support
            $table->foreign('modelo_id')->references('id')->on('modelos')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropForeign(['modelo_id']);
            $table->foreignId('modelo_id')->nullable(false)->change();
            $table->foreign('modelo_id')->references('id')->on('modelos')->onDelete('cascade');
        });
    }
};
