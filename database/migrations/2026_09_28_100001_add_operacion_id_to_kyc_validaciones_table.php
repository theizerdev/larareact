<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Liga cada validación KYC con su folio de operación.
     *
     * Sólo ADD COLUMN nullable: las validaciones anteriores quedan sin folio.
     */
    public function up(): void
    {
        Schema::table('kyc_validaciones', function (Blueprint $table) {
            if (! Schema::hasColumn('kyc_validaciones', 'operacion_id')) {
                $table->unsignedBigInteger('operacion_id')->nullable()->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('kyc_validaciones', function (Blueprint $table) {
            if (Schema::hasColumn('kyc_validaciones', 'operacion_id')) {
                $table->dropIndex(['operacion_id']);
                $table->dropColumn('operacion_id');
            }
        });
    }
};
