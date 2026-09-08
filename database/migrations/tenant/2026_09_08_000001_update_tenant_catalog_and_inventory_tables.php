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
        // 1. Actualizar tabla marcas
        if (Schema::hasTable('marcas')) {
            Schema::table('marcas', function (Blueprint $table) {
                if (!Schema::hasColumn('marcas', 'slug')) {
                    $table->string('slug')->nullable()->after('nombre');
                }
                if (!Schema::hasColumn('marcas', 'logo_url')) {
                    $table->string('logo_url')->nullable()->after('slug');
                }
                if (!Schema::hasColumn('marcas', 'descripcion')) {
                    $table->text('descripcion')->nullable()->after('logo_url');
                }
            });
        }

        // 2. Actualizar tabla categorias
        if (Schema::hasTable('categorias')) {
            Schema::table('categorias', function (Blueprint $table) {
                if (!Schema::hasColumn('categorias', 'slug')) {
                    $table->string('slug')->nullable()->after('nombre');
                }
                if (!Schema::hasColumn('categorias', 'icono')) {
                    $table->string('icono')->nullable()->after('slug');
                }
                if (!Schema::hasColumn('categorias', 'descripcion')) {
                    $table->text('descripcion')->nullable()->after('icono');
                }
            });
        }

        // 3. Actualizar tabla modelos
        if (Schema::hasTable('modelos')) {
            Schema::table('modelos', function (Blueprint $table) {
                if (!Schema::hasColumn('modelos', 'specs_overrides')) {
                    $table->json('specs_overrides')->nullable()->after('nombre_comercial');
                }
                if (!Schema::hasColumn('modelos', 'especificaciones')) {
                    $table->json('especificaciones')->nullable()->after('imagen_url');
                }
            });
        }

        // 4. Actualizar tabla inventory_movements
        if (Schema::hasTable('inventory_movements')) {
            Schema::table('inventory_movements', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_movements', 'costo_unitario')) {
                    $table->decimal('costo_unitario', 12, 2)->nullable()->after('stock_nuevo');
                }
                if (!Schema::hasColumn('inventory_movements', 'notas')) {
                    $table->text('notas')->nullable()->after('referencia');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('marcas')) {
            Schema::table('marcas', function (Blueprint $table) {
                if (Schema::hasColumn('marcas', 'logo_url')) {
                    $table->dropColumn('logo_url');
                }
                if (Schema::hasColumn('marcas', 'slug')) {
                    $table->dropColumn('slug');
                }
            });
        }

        if (Schema::hasTable('categorias')) {
            Schema::table('categorias', function (Blueprint $table) {
                if (Schema::hasColumn('categorias', 'icono')) {
                    $table->dropColumn('icono');
                }
                if (Schema::hasColumn('categorias', 'slug')) {
                    $table->dropColumn('slug');
                }
            });
        }

        if (Schema::hasTable('inventory_movements')) {
            Schema::table('inventory_movements', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_movements', 'costo_unitario')) {
                    $table->dropColumn('costo_unitario');
                }
                if (Schema::hasColumn('inventory_movements', 'notas')) {
                    $table->dropColumn('notas');
                }
            });
        }
    }
};
