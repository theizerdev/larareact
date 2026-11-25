<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Legacy (zona) que administra el usuario: el Responsable de zona y el
 * Gerente RRHH sólo ven a los colaboradores de su Legacy.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'legacy')) {
                $table->string('legacy', 100)->nullable()->index()->after('sucursal_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'legacy')) {
                $table->dropIndex(['legacy']);
                $table->dropColumn('legacy');
            }
        });
    }
};
