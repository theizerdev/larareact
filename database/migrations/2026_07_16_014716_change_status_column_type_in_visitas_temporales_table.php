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
        Schema::table('visitas_temporales', function (Blueprint $table) {
            $table->string('status', 50)->default('activo')->change();
        });

        // Map existing integer statuses to new string values
        \DB::table('visitas_temporales')->where('status', '1')->update(['status' => 'activo']);
        \DB::table('visitas_temporales')->where('status', '0')->update(['status' => 'suspendido']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitas_temporales', function (Blueprint $table) {
            // Revert status to smallInteger (default 1)
            \DB::table('visitas_temporales')->where('status', 'activo')->update(['status' => '1']);
            \DB::table('visitas_temporales')->where('status', 'suspendido')->update(['status' => '0']);
            \DB::table('visitas_temporales')->where('status', 'en_revision')->update(['status' => '0']);
            
            $table->smallInteger('status')->default(1)->change();
        });
    }
};
