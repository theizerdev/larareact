<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix any existing accesses where proveedor_id is set but tipo_acceso was set to 'visitante'
        DB::table('visitas_accesos')
            ->where(function ($query) {
                $query->whereNotNull('proveedor_id')
                      ->orWhereNotNull('proveedor_empleado_id');
            })
            ->where('tipo_acceso', 'visitante')
            ->update(['tipo_acceso' => 'proveedor']);

        // Fix any existing accesses where productor_id is set but tipo_acceso was set to 'visitante'
        DB::table('visitas_accesos')
            ->where(function ($query) {
                $query->whereNotNull('productor_id')
                      ->orWhereNotNull('productor_empleado_id');
            })
            ->where('tipo_acceso', 'visitante')
            ->update(['tipo_acceso' => 'productor']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse action needed for data fix
    }
};
