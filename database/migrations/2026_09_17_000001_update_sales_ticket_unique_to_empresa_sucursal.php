<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Eliminar la restricción única global que causaba colisión entre empresas y sucursales
            $table->dropUnique('sales_codigo_ticket_unique');

            // Crear restricción única compuesta por empresa, sucursal y código de ticket
            $table->unique(['empresa_id', 'sucursal_id', 'codigo_ticket'], 'sales_empresa_sucursal_ticket_unique');

            // Mantener un índice individual en codigo_ticket para búsquedas rápidas
            $table->index('codigo_ticket', 'sales_codigo_ticket_index');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_codigo_ticket_index');
            $table->dropUnique('sales_empresa_sucursal_ticket_unique');
            $table->unique('codigo_ticket', 'sales_codigo_ticket_unique');
        });
    }
};
