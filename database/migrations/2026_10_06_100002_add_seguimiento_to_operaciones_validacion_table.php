<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Liga pública de seguimiento del folio: la página donde la persona hace
     * los pasos que quedan (DIDIT hospedado y firma ZapSign) y que la PC
     * comparte por QR para continuar en el teléfono.
     */
    public function up(): void
    {
        if (! Schema::hasColumn('operaciones_validacion', 'token_seguimiento')) {
            Schema::table('operaciones_validacion', function (Blueprint $table) {
                $table->string('token_seguimiento', 64)->nullable()->unique();
                $table->timestamp('token_expira_en')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('operaciones_validacion', 'token_seguimiento')) {
            Schema::table('operaciones_validacion', function (Blueprint $table) {
                $table->dropUnique(['token_seguimiento']);
                $table->dropColumn(['token_seguimiento', 'token_expira_en']);
            });
        }
    }
};
