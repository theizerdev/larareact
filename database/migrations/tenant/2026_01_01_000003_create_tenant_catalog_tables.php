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
        Schema::create('categorias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('marcas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->string('nombre');
            $table->text('descripcion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('familias', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->string('nombre');
            $table->json('specs_json')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('modelos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->foreignId('familia_id')->nullable()->constrained('familias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->string('nombre_comercial')->nullable();
            $table->json('specs_overrides')->nullable();
            $table->string('codigo_modelo')->nullable();
            $table->string('imagen_url')->nullable();
            $table->json('especificaciones')->nullable();
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('servicios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->foreignId('modelo_id')->nullable()->constrained('modelos')->nullOnDelete();
            $table->string('nombre');
            $table->string('codigo')->nullable();
            $table->text('descripcion')->nullable();
            $table->decimal('precio', 15, 2)->default(0.00);
            $table->boolean('estado')->default(true);
            $table->timestamps();
        });

        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->unsignedBigInteger('sucursal_id')->nullable()->index();
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->foreignId('familia_id')->nullable()->constrained('familias')->nullOnDelete();
            $table->foreignId('modelo_id')->nullable()->constrained('modelos')->nullOnDelete();

            $table->string('sku')->nullable()->index();
            $table->string('codigo_barras')->nullable()->index();
            $table->string('nombre_variante');
            $table->string('condicion')->default('nuevo');
            $table->string('tipo_producto')->default('venta'); // venta, repuesto, etc.
            $table->string('tipo_venta')->default('unidad');
            $table->boolean('usa_inventario')->default(true);
            $table->json('variant_specs')->nullable();

            $table->decimal('precio_compra', 12, 2)->default(0.00);
            $table->decimal('precio_venta', 12, 2)->default(0.00);
            $table->decimal('precio_mayoreo', 12, 2)->default(0.00);
            $table->decimal('stock', 12, 3)->default(0.000);
            $table->decimal('stock_minimo', 12, 3)->default(2.000);

            $table->string('tipo_impuesto')->default('gravado');
            $table->decimal('tasa_iva', 5, 2)->default(16.00);
            $table->boolean('aplica_impuesto_adicional')->default(false);
            $table->decimal('tasa_impuesto_adicional', 5, 2)->default(0.00);
            $table->boolean('aplica_retencion')->default(false);
            $table->decimal('tasa_retencion', 5, 2)->default(0.00);
            $table->boolean('precio_incluye_impuestos')->default(true);

            $table->string('clave_sat_producto')->nullable()->default('43191501');
            $table->string('clave_sat_unidad')->nullable()->default('H87');
            $table->string('objeto_impuesto_sat')->nullable()->default('02');

            $table->boolean('estado')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
        Schema::dropIfExists('servicios');
        Schema::dropIfExists('modelos');
        Schema::dropIfExists('familias');
        Schema::dropIfExists('marcas');
        Schema::dropIfExists('categorias');
    }
};
