<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Relojes que se eliminaron en Hoshō. La fila se queda (si se borrara, el
     * siguiente sync la volvería a traer de BioTime) y sirve para que el sync
     * deje de bajar sus marcajes y a los empleados de las áreas que se quedan
     * sin reloj.
     */
    public function up(): void
    {
        Schema::table('biotime_dispositivos', function (Blueprint $table) {
            $table->timestamp('excluido_at')->nullable()->after('transaction_count');
        });
    }

    public function down(): void
    {
        Schema::table('biotime_dispositivos', function (Blueprint $table) {
            $table->dropColumn('excluido_at');
        });
    }
};
