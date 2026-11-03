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
        if (Schema::hasTable('reloj_equipos_biometricos') && !Schema::hasColumn('reloj_equipos_biometricos', 'sucursal_id')) {
            Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
                $table->foreignId('sucursal_id')->nullable()->after('reloj_ubicacion_id')->constrained('sucursales')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('reloj_equipos_biometricos') && Schema::hasColumn('reloj_equipos_biometricos', 'sucursal_id')) {
            Schema::table('reloj_equipos_biometricos', function (Blueprint $table) {
                $table->dropForeign(['sucursal_id']);
                $table->dropColumn('sucursal_id');
            });
        }
    }
};
