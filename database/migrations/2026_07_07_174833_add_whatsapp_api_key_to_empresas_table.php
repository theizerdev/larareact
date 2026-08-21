<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->string('api_key')->nullable();
            $table->string('whatsapp_api_key')->nullable();
            $table->integer('whatsapp_rate_limit')->default(100);
            $table->boolean('whatsapp_active')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_api_key', 'whatsapp_rate_limit', 'whatsapp_active']);
        });
    }
};
