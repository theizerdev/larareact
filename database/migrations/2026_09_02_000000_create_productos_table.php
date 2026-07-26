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
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            
            // Relaciones Directas con el Catálogo (Categoría, Marca, Familia, Modelo) y Empresa
            $table->foreignId('categoria_id')->nullable()->constrained('categorias')->nullOnDelete();
            $table->foreignId('marca_id')->nullable()->constrained('marcas')->nullOnDelete();
            $table->foreignId('familia_id')->nullable()->constrained('familias')->nullOnDelete();
            $table->foreignId('modelo_id')->constrained('modelos')->onDelete('cascade');
            
            $table->foreignId('empresa_id')->default(1)->constrained('empresas');
            $table->foreignId('sucursal_id')->default(1)->constrained('sucursales');
            
            // Identificadores de Inventario
            $table->string('sku')->unique();
            $table->string('codigo_barras')->nullable()->unique();
            $table->string('nombre_variante');
            
            // Condición del Equipo (Nuevo, Usado, Reacondicionado, Repuesto)
            $table->string('condicion')->default('nuevo');

            // Modalidad de Venta y Control de Inventario
            $table->string('tipo_venta')->default('unidad'); // unidad, granel, paquete
            $table->boolean('usa_inventario')->default(true);
            
            // Atributos de Variante en JSON (RAM, Almacenamiento, Color, etc.)
            $table->json('variant_specs')->nullable();
            
            // Precios y Stock (Compra, Venta Minorista, Venta Mayoreo)
            $table->decimal('precio_compra', 12, 2)->default(0);
            $table->decimal('precio_venta', 12, 2)->default(0);
            $table->decimal('precio_mayoreo', 12, 2)->default(0);
            
            $table->decimal('stock', 12, 3)->default(0); // Permite decimales para venta a granel
            $table->decimal('stock_minimo', 12, 3)->default(2);
            
            // Impuestos Globales (Multipaís / VAT / Sales Tax)
            $table->string('tipo_impuesto')->default('gravado'); // gravado, exento, tasa_cero
            $table->decimal('tasa_iva', 5, 2)->default(16.00); // Impuesto principal (IVA/VAT)
            $table->boolean('aplica_impuesto_adicional')->default(false);
            $table->decimal('tasa_impuesto_adicional', 5, 2)->default(0.00);
            $table->boolean('aplica_retencion')->default(false);
            $table->decimal('tasa_retencion', 5, 2)->default(0.00);
            $table->boolean('precio_incluye_impuestos')->default(true);

            // Facturación Electrónica / Códigos Fiscales (CFDI / SAT / UNSPSC Global)
            $table->string('clave_sat_producto')->nullable()->default('43191501'); // Código Prod/Serv
            $table->string('clave_sat_unidad')->nullable()->default('H87'); // Unidad Fiscal (H87=Pza, KGM=Kg, E48=Servicio)
            $table->string('objeto_impuesto_sat')->nullable()->default('02'); // Objeto de Impuesto

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
    }
};
