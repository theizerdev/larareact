<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productores', function (Blueprint $table) {
            $table->string('foto_empresa')->nullable();
            $table->string('foto_responsable')->nullable();
            $table->string('ine_responsable_frente')->nullable();
            $table->string('ine_responsable_reverso')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('productores', function (Blueprint $table) {
            $table->dropColumn(['foto_empresa', 'foto_responsable', 'ine_responsable_frente', 'ine_responsable_reverso']);
        });
    }
};
