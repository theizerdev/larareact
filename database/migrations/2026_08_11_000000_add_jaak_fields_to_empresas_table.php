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
        Schema::table('empresas', function (Blueprint $table) {
            // text() en vez de string(): el valor cifrado (cast 'encrypted' en el
            // modelo) de un JWT largo supera los 255 caracteres de un VARCHAR.
            $table->text('jaak_api_key')->nullable()->after('control_acceso_active');
            $table->string('jaak_environment', 20)->default('sandbox')->after('jaak_api_key');
            $table->boolean('jaak_active')->default(false)->after('jaak_environment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('empresas', function (Blueprint $table) {
            $table->dropColumn([
                'jaak_api_key',
                'jaak_environment',
                'jaak_active',
            ]);
        });
    }
};
