<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuraciones_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->string('rubro_comercial')->default('retail'); // retail, servicio_tecnico, hibrido, mayorista, gastronomia
            
            $table->unsignedBigInteger('cuenta_caja_id')->nullable();
            $table->unsignedBigInteger('cuenta_banco_id')->nullable();
            $table->unsignedBigInteger('cuenta_ventas_productos_id')->nullable();
            $table->unsignedBigInteger('cuenta_ventas_servicios_id')->nullable();
            $table->unsignedBigInteger('cuenta_costo_ventas_productos_id')->nullable();
            $table->unsignedBigInteger('cuenta_costo_repuestos_id')->nullable();
            $table->unsignedBigInteger('cuenta_inventario_productos_id')->nullable();
            $table->unsignedBigInteger('cuenta_inventario_repuestos_id')->nullable();
            $table->unsignedBigInteger('cuenta_cuentas_por_cobrar_id')->nullable();
            $table->unsignedBigInteger('cuenta_cuentas_por_pagar_id')->nullable();
            $table->unsignedBigInteger('cuenta_gastos_generales_id')->nullable();
            
            $table->boolean('contabilidad_automatica')->default(true);
            $table->timestamps();

            $table->foreign('cuenta_caja_id', 'cfg_caja_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_banco_id', 'cfg_banco_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_ventas_productos_id', 'cfg_vta_prod_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_ventas_servicios_id', 'cfg_vta_srv_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_costo_ventas_productos_id', 'cfg_cst_prod_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_costo_repuestos_id', 'cfg_cst_rep_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_inventario_productos_id', 'cfg_inv_prod_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_inventario_repuestos_id', 'cfg_inv_rep_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_cuentas_por_cobrar_id', 'cfg_cxc_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_cuentas_por_pagar_id', 'cfg_cxp_fk')->references('id')->on('cuentas_contables')->onDelete('set null');
            $table->foreign('cuenta_gastos_generales_id', 'cfg_gastos_fk')->references('id')->on('cuentas_contables')->onDelete('set null');

            $table->unique('empresa_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('configuraciones_contables');
    }
};
