<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            $table->foreignId('cierre_mensual_id')->nullable()->after('user_id')->constrained('cierres_mensuales')->onDelete('set null');
            $table->boolean('usar_fondo_mes')->default(false)->after('cierre_mensual_id');
        });
    }

    public function down(): void
    {
        Schema::table('compras', function (Blueprint $table) {
            $table->dropForeign(['cierre_mensual_id']);
            $table->dropColumn(['cierre_mensual_id', 'usar_fondo_mes']);
        });
    }
};
