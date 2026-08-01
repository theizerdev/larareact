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
        Schema::table('users', function (Blueprint $table) {
            $table->string('whatsapp_otp_code', 8)->nullable()->after('password');
            $table->timestamp('whatsapp_otp_expires_at')->nullable()->after('whatsapp_otp_code');
            $table->timestamp('whatsapp_verified_at')->nullable()->after('whatsapp_otp_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['whatsapp_otp_code', 'whatsapp_otp_expires_at', 'whatsapp_verified_at']);
        });
    }
};
