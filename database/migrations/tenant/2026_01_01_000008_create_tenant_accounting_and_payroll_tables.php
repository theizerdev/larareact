<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuentas_contables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('codigo', 50);
            $table->string('codigo_sat', 20)->nullable();
            $table->string('nombre');
            $table->enum('tipo', ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto', 'costo']);
            $table->enum('naturaleza', ['deudora', 'acreedora']);
            $table->integer('nivel')->default(1);
            $table->foreignId('padre_id')->nullable()->constrained('cuentas_contables')->cascadeOnDelete();
            $table->boolean('acepta_movimiento')->default(true);
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->index(['empresa_id', 'codigo']);
        });

        Schema::create('asientos_contables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->string('numero_asiento', 255)->index();
            $table->datetime('fecha');
            $table->string('glosa', 255);
            $table->string('origen_type')->nullable();
            $table->unsignedBigInteger('origen_id')->nullable();
            $table->decimal('tasa_cambio', 12, 4)->default(1.0000);
            $table->enum('estado', ['borrador', 'contabilizado', 'anulado'])->default('contabilizado');
            $table->unsignedBigInteger('created_by')->nullable()->index();
            $table->timestamps();

            $table->index(['origen_type', 'origen_id']);
        });

        Schema::create('apuntes_contables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asiento_id')->constrained('asientos_contables')->cascadeOnDelete();
            $table->foreignId('cuenta_id')->constrained('cuentas_contables')->cascadeOnDelete();
            $table->string('tercero_type')->nullable();
            $table->unsignedBigInteger('tercero_id')->nullable();
            $table->decimal('debe', 15, 2)->default(0.00);
            $table->decimal('haber', 15, 2)->default(0.00);
            $table->decimal('debe_usd', 15, 2)->default(0.00);
            $table->decimal('haber_usd', 15, 2)->default(0.00);
            $table->string('referencia')->nullable();
            $table->timestamps();

            $table->index(['tercero_type', 'tercero_id']);
        });

        Schema::create('configuraciones_contables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->string('rubro_comercial')->default('retail');
            
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

            $table->foreign('cuenta_caja_id', 'cfg_caja_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_banco_id', 'cfg_banco_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_ventas_productos_id', 'cfg_vta_prod_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_ventas_servicios_id', 'cfg_vta_srv_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_costo_ventas_productos_id', 'cfg_cst_prod_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_costo_repuestos_id', 'cfg_cst_rep_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_inventario_productos_id', 'cfg_inv_prod_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_inventario_repuestos_id', 'cfg_inv_rep_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_cuentas_por_cobrar_id', 'cfg_cxc_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_cuentas_por_pagar_id', 'cfg_cxp_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
            $table->foreign('cuenta_gastos_generales_id', 'cfg_gastos_fk')->references('id')->on('cuentas_contables')->nullOnDelete();
        });

        Schema::create('nominas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('empresa_id')->nullable()->index();
            $table->foreignId('sucursal_id')->nullable()->constrained('sucursales')->nullOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->smallInteger('year');
            $table->tinyInteger('month');
            $table->enum('formato_pago', ['diaria', 'semanal', 'quincenal', 'mensual'])->default('mensual');
            $table->date('periodo_inicio')->nullable();
            $table->date('periodo_fin')->nullable();
            $table->enum('estado', ['borrador', 'cerrada', 'pagada'])->default('borrador')->index();
            $table->decimal('total_bruto', 14, 2)->default(0.00);
            $table->decimal('total_bonos', 14, 2)->default(0.00);
            $table->decimal('total_descuentos', 14, 2)->default(0.00);
            $table->decimal('total_comision_reparaciones', 14, 2)->default(0.00);
            $table->decimal('total_neto', 14, 2)->default(0.00);
            $table->timestamp('fecha_cierre')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });

        Schema::create('nomina_detalles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nomina_id')->constrained('nominas')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('rol_nombre')->nullable();
            $table->decimal('sueldo_base_snapshot', 14, 2)->default(0.00);
            $table->decimal('bonos', 14, 2)->default(0.00);
            $table->decimal('descuentos', 14, 2)->default(0.00);
            $table->decimal('comision_reparaciones', 14, 2)->default(0.00);
            $table->decimal('monto_pagado_reparaciones_periodo', 14, 2)->default(0.00);
            $table->unsignedInteger('reparaciones_reparadas_periodo')->default(0);
            $table->decimal('total_neto', 14, 2)->default(0.00);
            $table->enum('estado_pago', ['pendiente', 'pagado'])->default('pendiente');
            $table->timestamp('fecha_pago')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->unique(['nomina_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nomina_detalles');
        Schema::dropIfExists('nominas');
        Schema::dropIfExists('configuraciones_contables');
        Schema::dropIfExists('apuntes_contables');
        Schema::dropIfExists('asientos_contables');
        Schema::dropIfExists('cuentas_contables');
    }
};
