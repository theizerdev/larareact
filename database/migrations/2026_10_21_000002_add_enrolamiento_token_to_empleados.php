<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->string('enrolamiento_token', 64)->nullable()->unique()->after('enrolado_en');
            $table->timestamp('enrolamiento_token_expires_at')->nullable()->after('enrolamiento_token');
        });
    }

    public function down(): void
    {
        Schema::table('empleados', function (Blueprint $table) {
            $table->dropColumn(['enrolamiento_token', 'enrolamiento_token_expires_at']);
        });
    }
};
