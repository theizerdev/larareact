<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proveedores', function (Blueprint $table) {
            if (!Schema::hasColumn('proveedores', 'sucursal_id')) {
                $table->unsignedBigInteger('sucursal_id')->nullable()->after('empresa_id');
            }
            if (!Schema::hasColumn('proveedores', 'nombre_comercial')) {
                $table->string('nombre_comercial')->nullable()->after('razon_social');
            }
            if (!Schema::hasColumn('proveedores', 'rif_documento')) {
                $table->string('rif_documento')->nullable()->after('nombre_comercial');
            }
            if (!Schema::hasColumn('proveedores', 'contacto_nombre')) {
                $table->string('contacto_nombre')->nullable()->after('rif_documento');
            }
            if (!Schema::hasColumn('proveedores', 'categoria_insumos')) {
                $table->string('categoria_insumos')->nullable()->after('direccion');
            }
            if (!Schema::hasColumn('proveedores', 'notas')) {
                $table->text('notas')->nullable()->after('categoria_insumos');
            }
            if (!Schema::hasColumn('proveedores', 'estado')) {
                $table->boolean('estado')->default(true)->after('notas');
            }
        });

        // Copy existing data from old column names if they existed
        if (Schema::hasColumn('proveedores', 'documento') && Schema::hasColumn('proveedores', 'rif_documento')) {
            \Illuminate\Support\Facades\DB::statement("UPDATE proveedores SET rif_documento = documento WHERE (rif_documento IS NULL OR rif_documento = '') AND documento IS NOT NULL");
        }
        if (Schema::hasColumn('proveedores', 'nombre_contacto') && Schema::hasColumn('proveedores', 'contacto_nombre')) {
            \Illuminate\Support\Facades\DB::statement("UPDATE proveedores SET contacto_nombre = nombre_contacto WHERE (contacto_nombre IS NULL OR contacto_nombre = '') AND nombre_contacto IS NOT NULL");
        }
        if (Schema::hasColumn('proveedores', 'status') && Schema::hasColumn('proveedores', 'estado')) {
            \Illuminate\Support\Facades\DB::statement("UPDATE proveedores SET estado = status WHERE status IS NOT NULL");
        }
    }

    public function down(): void
    {
        // Keep columns for safety
    }
};

